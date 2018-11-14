import {Logic} from '../logic';
import * as transfer from './transfer/models';
import {Transfer} from './transfer/models';
import {Errors} from 'typescript-rest';
import {AutoWired, Inject} from 'typescript-ioc';
import {FundingSourceService} from '../foundingSource/services';
import {TransactionService} from './service';
import {UserService} from '../user/service';
import {TransferService} from './transfer/service';
import * as users from '../user/models';
import {transaction} from 'objection';
import * as dwolla from '../dwolla';
import {DwollaRequestError, event} from '../dwolla';
import * as models from './models';
import {Statuses, Transaction, TransactionRequest} from './models';
import {MailerService} from '../mailer';
import {Logger} from '../logger';
import {FundingSource, VerificationStatuses} from '../foundingSource/models';
import {Config} from '../config';
import {JobService} from '../job/service';
import {Job} from '../job/models';
import * as _ from 'lodash';
import {BaseError} from '../api';
import {User} from '../user/models';
import {TenantService} from '../tenant/service';
import {Tenant} from '../tenant/models';

@AutoWired
export class UpdateTransactionStatusLogic extends Logic {
    @Inject private transactionService: TransactionService;
    @Inject private userService: UserService;
    @Inject private transferService: TransferService;
    @Inject protected mailer: MailerService;
    @Inject protected logger: Logger;

    private mapDwollaStatus(status: string) {
        switch (status) {
            case event.TYPE.transferCanceled:
                return models.Statuses.cancelled;
            case event.TYPE.transferFailed:
                return models.Statuses.failed;
            case event.TYPE.transferReclaimed:
                return models.Statuses.reclaimed;
            case event.TYPE.transferCompleted:
                return models.Statuses.processed;
        }

        return status;
    }

    async execute(_transaction: Transaction, status: string): Promise<any> {
        await transaction(this.transactionService.transaction(), async trx => {
            status = this.mapDwollaStatus(status);
            _transaction.status = status;
            _transaction.transfer.status = status;

            await this.transactionService.update(_transaction, trx);
            await this.transferService.update(_transaction.transfer, trx);
        });

        // don't abort transaction if email was not send
        try {
            const user = await this.userService.get(_transaction.userId);
            const admin = await this.userService.get(_transaction.adminId);
            switch (status) {
                case Statuses.failed:
                    await Promise.all([
                        this.mailer.sendCustomerTransferFailedSender(admin, {user, admin, transaction: _transaction}),
                        this.mailer.sendCustomerTransferFailedReceiver(user, {admin, user, transaction: _transaction})
                    ]);
                    break;
                case Statuses.processed:
                    await Promise.all([
                        this.mailer.sendCustomerTransferCompletedSender(admin, {
                            admin,
                            user,
                            transaction: _transaction
                        }),
                        this.mailer.sendCustomerTransferCompletedReceiver(user, {
                            admin,
                            user,
                            transaction: _transaction
                        })
                    ]);
                    break;
                case Statuses.new:
                    await Promise.all([
                        this.mailer.sendCustomerTransferCreatedSender(admin, {admin, user, transaction: _transaction}),
                        this.mailer.sendCustomerTransferCreatedReceiver(user, {admin, user, transaction: _transaction})
                    ]);
                    break;
            }
        } catch (e) {
            this.logger.error(e);
        }
    }
}

@AutoWired
export class CancelTransactionLogic extends Logic {
    @Inject protected dwollaClient: dwolla.Client;

    async execute(_transaction: models.Transaction): Promise<any> {
        const updateStatusLogic = new UpdateTransactionStatusLogic(this.context);
        const result = await this.dwollaClient.cancelTransfer(_transaction.transfer.externalId);

        if (result) {
            await updateStatusLogic.execute(_transaction, models.Statuses.cancelled);
        }
    }
}

@AutoWired
export class ChargeTenantLogic extends Logic {
    @Inject protected dwollaClient: dwolla.Client;
    @Inject protected tenantService: TenantService;
    @Inject protected transferService: TransferService;
    @Inject protected config: Config;

    async execute(value: number, admin: User): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(this.context.getTenantId());
        if (!tenant.fundingSourceUri) {
            throw new ChargeTenantError('Tenant funding source not found');
        }

        if (tenant.fundingSourceVerificationStatus != VerificationStatuses.completed) {
            throw new ChargeTenantError('Tenant funding source not verified');
        }

        const transfer = new Transfer();
        transfer.adminId = admin.id;
        transfer.status = Statuses.new;
        transfer.destinationUri = this.config.get('dwolla.masterFunding');
        transfer.sourceUri = tenant.fundingSourceUri;
        transfer.value = value;

        const dwollaTransfer = dwolla.transfer.factory({});
        dwollaTransfer.setSource(transfer.sourceUri);
        dwollaTransfer.setDestination(transfer.destinationUri);
        dwollaTransfer.setAmount(transfer.value);
        dwollaTransfer.setCurrency('USD');

        try {
            transfer.externalId = await this.dwollaClient.createTransfer(dwollaTransfer);
            const _transfer = await this.dwollaClient.getTransfer(transfer.externalId);
            transfer.status = _transfer.status;
            return await this.transferService.createTransfer(transfer);
        } catch (e) {
            if (e instanceof DwollaRequestError) {
                let message;
                if (e.message.search('Sender restricted') != -1) {
                    message = 'Tenant company is in restricted mode, finish verification';
                } else if (e.message.search('Invalid funding source') != -1) {
                    message = 'Funding source is not verified';
                } else {
                    message = e.toValidationError().message;
                }

                throw new ChargeTenantError(message);
            }

            throw new ChargeTenantError(e.message);
        }
    }
}

@AutoWired
export class PrepareTransferLogic extends Logic {
    @Inject private fundingService: FundingSourceService;
    @Inject private transactionService: TransactionService;
    @Inject private transferService: TransferService;
    @Inject private userService: UserService;
    @Inject private config: Config;

    async execute(transactions: Array<models.Transaction>, user, admin: users.User, tenantCharge: Transfer): Promise<any> {
        const defaultFunding: FundingSource = await this.fundingService.getDefault(user.id);
        if (!defaultFunding) {
            throw new models.InvalidTransferDataError('Bank account not configured for recipient');
        }

        let transfer = new Transfer();
        transfer.adminId = admin.id;
        transfer.status = Statuses.new;
        transfer.destinationUri = defaultFunding.dwollaUri;
        transfer.sourceUri = this.config.get('dwolla.masterFunding');
        transfer.value = tenantCharge.value;
        transfer.tenantChargeId = tenantCharge.id;

        await transaction(this.transactionService.transaction(), async trx => {
            transfer = await this.transferService.createTransfer(transfer, trx);
            for (const trans of transactions) {
                trans.transferId = transfer.id;
                await this.transactionService.update(trans, trx);
            }
        });

        return transfer;
    }
}

const calculateTransactionsValue = (transactions: Array<models.Transaction>) => {
    return transactions.reduce((total, trans) => { return total + Number(trans.value); }, 0);
};

@AutoWired
export class CreateTransactionTransferLogic extends Logic {
    @Inject private transactionService: TransactionService;
    @Inject private userService: UserService;
    @Inject private transferService: TransferService;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private config: Config;

    async execute(id: string): Promise<any> {
        const transaction = await this.transactionService.get(id);
        if (!transaction) {
            throw new Errors.NotFoundError();
        }

        try {
            if (!transaction.transferId) {
                const admin = await this.userService.get(this.context.getUser().id);
                const user = await this.userService.get(transaction.userId);
                const tenantLogic = new ChargeTenantLogic(this.context);
                const tenantCharge = await tenantLogic.execute(calculateTransactionsValue([transaction]), admin);
                const logic = new PrepareTransferLogic(this.context);
                transaction.transfer = await logic.execute([transaction], user, admin, tenantCharge);
            } else {
                transaction.transfer = await this.transferService.get(transaction.transferId);
            }

            if (transaction.transfer.status !== transfer.Statuses.new) {
                throw new Errors.NotAcceptableError('Transfer already pending');
            }

            await this.createExternalTransfer(transaction);
        } catch (e) {
            if (e instanceof models.InvalidTransferDataError || e instanceof Errors.NotAcceptableError || e instanceof ChargeTenantError) {
                throw new Errors.NotAcceptableError(e.message);
            }

            throw new Errors.InternalServerError(e.message);
        }

        return transaction;
    }

    private async createExternalTransfer(_transaction: models.Transaction) {
        const transfer = dwolla.transfer.factory({});
        transfer.setSource(_transaction.transfer.sourceUri);
        transfer.setDestination(_transaction.transfer.destinationUri);
        transfer.setAmount(_transaction.transfer.value);
        transfer.setCurrency('USD');

        const updateStatusLogic = new UpdateTransactionStatusLogic(this.context);

        try {
            _transaction.transfer.externalId = await this.dwollaClient.createTransfer(transfer);
            const _transfer = await this.dwollaClient.getTransfer(_transaction.transfer.externalId);
            await updateStatusLogic.execute(_transaction, _transfer.status);
        } catch (e) {
            await updateStatusLogic.execute(_transaction, models.Statuses.failed);
            throw e;
        }
    }
}

@AutoWired
export class CreateTransactionsTransferLogic extends Logic {
    @Inject private transactionService: TransactionService;
    @Inject private userService: UserService;
    @Inject private transferService: TransferService;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private config: Config;

    async execute(id: string, data: Array<string>): Promise<any> {
        const transactions = [];
        let userId;

        for (const transId of data) {
            const trans = await this.transactionService.get(transId);
            if (!trans) {
                continue;
            }

            if (!userId) {
                userId = trans.userId;
            } else if (userId != trans.userId) {
                continue; // TODO: throw validation error?
            }

            if (trans.transferId || trans.status != Statuses.new) {
                continue; // TODO: throw validation error?
            }

            transactions.push(trans);
        }

        if (_.isEmpty(transactions)) {
            throw new Errors.ConflictError('No transactions provided');
        }

        try {
            const admin = await this.userService.get(this.context.getUser().id);
            const user = await this.userService.get(userId);
            const tenantLogic = new ChargeTenantLogic(this.context);
            const tenantCharge = await tenantLogic.execute(calculateTransactionsValue(transactions), admin);
            const logic = new PrepareTransferLogic(this.context);
            const transfer = await logic.execute(transactions, user, admin, tenantCharge);

            await this.createExternalTransfer(transfer, transactions);
            // TODO: send email
            return transfer;
        } catch (e) {
            if (e instanceof models.InvalidTransferDataError || e instanceof Errors.NotAcceptableError || e instanceof ChargeTenantError) {
                throw new Errors.NotAcceptableError(e.message);
            }

            throw new Errors.InternalServerError(e.message);
        }
    }

    private async createExternalTransfer(_transfer: Transfer, transactions: Array<models.Transaction>) {
        const transfer = dwolla.transfer.factory({});
        transfer.setSource(_transfer.sourceUri);
        transfer.setDestination(_transfer.destinationUri);
        transfer.setAmount(_transfer.value);
        transfer.setCurrency('USD');

        // TODO: better error handling
        try {
            _transfer.externalId = await this.dwollaClient.createTransfer(transfer);
            const _dwollaTransfer = await this.dwollaClient.getTransfer(_transfer.externalId);
            _transfer.status = _dwollaTransfer.status;

            await transaction(this.transactionService.transaction(), async trx => {
                await this.transferService.update(_transfer, trx);

                for (const trans of transactions) {
                    trans.status = _transfer.status;
                    await this.transactionService.update(trans, trx);
                }
            });
        } catch (e) {
            _transfer.status = Statuses.failed;

            await transaction(this.transactionService.transaction(), async trx => {
                await this.transferService.update(_transfer, trx);

                for (const trans of transactions) {
                    trans.status = _transfer.status;
                    await this.transactionService.update(trans, trx);
                }
            });

            throw e;
        }
    }
}

@AutoWired
export class CreateTransactionLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private fundingService: FundingSourceService;
    @Inject private jobService: JobService;
    @Inject private transactionService: TransactionService;

    async execute(data: TransactionRequest): Promise<any> {
        // was an user id or external id provided
        let user: users.User = null;
        if (data.externalId) {
            user = await this.userService.findByExternalIdAndTenant(data.externalId, this.context.getTenantId());
            if (!user) {
                throw new Errors.NotFoundError('External Id not found');
            }

            data.userId = user.id;
        } else {
            user = await this.userService.get(data.userId);
        }

        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        if (!user.isContractor()) {
            throw new Errors.NotAcceptableError('User is not a contractor');
        }

        const defaultFunding = await this.fundingService.getDefault(user.id);
        if (!defaultFunding) {
            throw new Errors.NotAcceptableError('User does not have a bank account');
        }

        return await transaction(models.Transaction.knex(), async trx => {
            const {job: jobRequest} = data;
            let jobFromDb;
            if (!jobRequest.id) {
                const jobEntity = Job.factory(jobRequest);
                jobFromDb = await this.jobService.insert(jobEntity, trx);
            } else {
                jobFromDb = await this.jobService.get(jobRequest.id);
            }
            if (!jobFromDb) {
                throw new Errors.NotFoundError('Job not found');
            }

            const transactionEntity = models.Transaction.factory(data);
            transactionEntity.adminId = this.context.getUser().id;
            transactionEntity.jobId = jobFromDb.id;
            const transactionFromDb = await this.transactionService.insert(transactionEntity, trx);
            transactionFromDb.job = jobFromDb;
            return transactionFromDb;
        });
    }
}

export class ChargeTenantError extends BaseError {
}