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
import {DwollaRequestError} from '../dwolla';
import * as models from './models';
import {Statuses, Transaction, TransactionExistingJobRequest, TransactionPatchRequest} from './models';
import {MailerService} from '../mailer';
import {Logger} from '../logger';
import {FundingSource, VerificationStatuses} from '../foundingSource/models';
import {Config} from '../config';
import {JobService} from '../job/service';
import {Job, JobRequest} from '../job/models';
import * as _ from 'lodash';
import {BaseError} from '../api';
import {User} from '../user/models';
import {TenantService} from '../tenant/service';
import {Tenant} from '../tenant/models';
import {ContractorDefaultFundingSourcesLogic} from '../foundingSource/logic';

@AutoWired
export class UpdateTransactionStatusLogic extends Logic {
    @Inject private transactionService: TransactionService;
    @Inject private transferService: TransferService;
    @Inject private userService: UserService;
    @Inject protected mailer: MailerService;
    @Inject protected logger: Logger;
    @Inject private fundingSourceService: FundingSourceService;
    @Inject private tenantService: TenantService;

    async execute(_transaction: Transaction, transfer: Transfer, status: string): Promise<any> {
        if (_transaction.status === status) return;

        await transaction(this.transactionService.transaction(), async trx => {
            _transaction.status = status;
            transfer.status = status;

            await this.transactionService.update(_transaction, trx);
            await this.transferService.update(transfer, trx);
        });

        // don't abort transaction if email was not send
        try {
            const user = await this.userService.get(_transaction.userId);
            const admin = await this.userService.get(_transaction.adminId);
            const destination = await this.fundingSourceService.getByDwollaUri(transfer.destinationUri);
            const tenant = await this.tenantService.get(_transaction.tenantId);
            switch (status) {
                case Statuses.processing:
                    await Promise.all([
                        this.mailer.sendCustomerTransferCreatedSender(user, admin, _transaction, destination),
                        this.mailer.sendCustomerTransferCreatedReceiver(user, tenant, _transaction),
                    ]);
                    break;
                case Statuses.processed:
                    await Promise.all([
                        this.mailer.sendCustomerTransferCompletedSender(user, admin, _transaction, destination),
                        this.mailer.sendCustomerTransferCompletedReceiver(user, tenant, _transaction),
                    ]);
                    break;
                case Statuses.failed:
                    await Promise.all([
                        this.mailer.sendCustomerTransferFailedSender(user, admin, _transaction, destination),
                        this.mailer.sendCustomerTransferFailedReceiver(user, tenant, _transaction),
                    ]);
                    break;
                case Statuses.cancelled:
                    await Promise.all([
                        this.mailer.sendCustomerTransferCancelledSender(user, admin, _transaction, destination),
                        this.mailer.sendCustomerTransferCancelledReceiver(user, tenant, _transaction),
                    ]);
                    break;
                default:
                    break;
            }
        } catch (error) {
            this.logger.error(error.message);
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
            await updateStatusLogic.execute(_transaction, _transaction.transfer, models.Statuses.cancelled);
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
            transfer.tenantId = tenant.id;
            return await this.transferService.createTransfer(transfer);
        } catch (e) {
            if (e instanceof DwollaRequestError) {
                let message;
                if (e.message.search('Sender restricted') != -1) {
                    message = 'Tenant company is in restricted mode, finish verification';
                } else if (e.message.search('Invalid funding source') != -1) {
                    message = 'Funding source is not verified';
                } else if (e.message.search('Invalid amount') != -1) {
                    message = 'Tenant cannot be currently charged by that amount';
                } else {
                    message = e.toValidationError().message;
                    if (message instanceof Object) {
                        message = JSON.stringify(message);
                    }
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
    @Inject protected tenantService: TenantService;
    @Inject private config: Config;

    async execute(
        transactions: Array<models.Transaction>,
        user,
        admin: users.User,
        value: number,
    ): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(this.context.getTenantId());
        const logic = new ContractorDefaultFundingSourcesLogic(this.context);
        const defaultFunding: FundingSource = await logic.execute(user.id);
        if (!defaultFunding) {
            throw new models.InvalidTransferDataError('Bank account not configured for recipient');
        }

        let transfer = new Transfer();
        transfer.adminId = admin.id;
        transfer.status = Statuses.new;
        transfer.destinationUri = defaultFunding.dwollaUri;
        transfer.sourceUri = tenant.fundingSourceUri;
        transfer.value = value;
        // transfer.sourceUri = this.config.get('dwolla.masterFunding');
        // transfer.value = tenantCharge.value;
        // transfer.tenantChargeId = tenantCharge.id;
        transfer.tenantId = this.context.getTenantId();

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
    return transactions.reduce((total, trans) => {
        return total + Number(trans.value);
    }, 0);
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
                const admin = await this.userService.get(this.context.getUserId());
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
            if (
                e instanceof models.InvalidTransferDataError ||
                e instanceof Errors.NotAcceptableError ||
                e instanceof ChargeTenantError
            ) {
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
            await updateStatusLogic.execute(_transaction, _transaction.transfer, _transfer.status);
        } catch (e) {
            // handled w/o logic so an email isn't sent
            await transaction(this.transactionService.transaction(), async trx => {
                _transaction.status = status;
                _transaction.transfer.status = status;

                await this.transactionService.update(_transaction, trx);
                await this.transferService.update(_transaction.transfer, trx);
            });
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
            const admin = await this.userService.get(this.context.getUserId());
            const user = await this.userService.get(userId);
            // const tenantLogic = new ChargeTenantLogic(this.context);
            // const tenantCharge = await tenantLogic.execute(calculateTransactionsValue(transactions), admin);
            const logic = new PrepareTransferLogic(this.context);
            const transfer = await logic.execute(transactions, user, admin, calculateTransactionsValue(transactions));
            await this.createExternalTransfer(transfer, transactions);
            // TODO: send email
            return transfer;
        } catch (e) {
            if (
                e instanceof models.InvalidTransferDataError ||
                e instanceof Errors.NotAcceptableError ||
                e instanceof ChargeTenantError
            ) {
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
export class CreateTransactionWithExistingJobLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private fundingService: FundingSourceService;
    @Inject private jobService: JobService;
    @Inject private transactionService: TransactionService;

    async execute(userId, jobId: string, value: number, externalId?: string): Promise<any> {
        const job = await this.jobService.get(jobId);
        if (!job) {
            throw new Errors.NotFoundError('Job not found');
        }

        if (!job.isActive) {
            throw new Errors.NotAcceptableError('Job is not active');
        }

        const logic = new CreateTransactionLogic(this.context);
        return await logic.execute(userId, value, job, externalId);
    }
}

@AutoWired
export class CreateTransactionWithCustomJobLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private fundingService: FundingSourceService;
    @Inject private jobService: JobService;
    @Inject private transactionService: TransactionService;

    async execute(userId: string, jobData: JobRequest, value: number, externalId?: string): Promise<any> {
        const job: Job = Job.factory(jobData);
        job.isActive = true;
        job.isCustom = true;
        const logic = new CreateTransactionLogic(this.context);
        return await logic.execute(userId, value, job, externalId);
    }
}

@AutoWired
export class CreateTransactionLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private fundingService: FundingSourceService;
    @Inject private jobService: JobService;
    @Inject private transactionService: TransactionService;

    async execute(userId: string, value: number, job: Job, externalId?: string): Promise<any> {
        let user: users.User = null;
        if (externalId) {
            user = await this.userService.findByExternalIdAndTenant(externalId, this.context.getTenantId());
            if (!user) {
                throw new Errors.NotFoundError('External Id not found');
            }

            userId = user.id;
        } else {
            user = await this.userService.get(userId);
        }

        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        if (!user.isContractor()) {
            throw new Errors.NotAcceptableError('User is not a contractor');
        }

        const logic = new ContractorDefaultFundingSourcesLogic(this.context);
        const defaultFunding = await logic.execute(user.id);
        if (!defaultFunding) {
            throw new Errors.NotAcceptableError('User does not have a bank account');
        }

        return await transaction(models.Transaction.knex(), async trx => {
            // override the base job value if a value was provided in the request
            if (!value) {
                value = job.value;
            }

            if (!job.id) {
                job = await this.jobService.insert(job, trx);
            }

            const transactionEntity = models.Transaction.factory({});
            transactionEntity.adminId = this.context.getUserId();
            transactionEntity.userId = userId;
            transactionEntity.jobId = job.id;
            transactionEntity.value = value;
            const transactionFromDb = await this.transactionService.insert(transactionEntity, trx);
            transactionFromDb.job = job;
            return transactionFromDb;
        });
    }
}

@AutoWired
export class UpdateTransactionLogic extends Logic {
    @Inject private transactionService: TransactionService;
    @Inject private jobService: JobService;

    async execute(id: string, data: TransactionPatchRequest): Promise<any> {
        const transactionFromDb = await this.transactionService.get(id);
        if (!transactionFromDb) {
            throw new Errors.NotFoundError('Transaction not found');
        }

        if (transactionFromDb.status !== Statuses.new) {
            throw new Errors.ConflictError('Transaction cannot be updated');
        }

        let jobFromDb: Job;
        if (data.jobId) {
            jobFromDb = await this.jobService.get(data.jobId);
            if (!jobFromDb) {
                throw new Errors.NotFoundError('Job not found');
            }
        } else {
            jobFromDb = await this.jobService.get(transactionFromDb.jobId);
        }

        transactionFromDb.merge(data);
        await this.transactionService.update(transactionFromDb);

        transactionFromDb.job = jobFromDb;
        return transactionFromDb;
    }
}

@AutoWired
export class DeleteTransactionLogic extends Logic {
    @Inject private transactionService: TransactionService;

    async execute(id: string): Promise<any> {
        const _transaction = await this.transactionService.get(id);
        if (!_transaction) {
            throw new Errors.NotFoundError('Transaction not found');
        }

        if (_transaction.status !== Statuses.new) {
            throw new Errors.ConflictError('Transaction cannot be deleted');
        }

        await this.transactionService.delete(_transaction);
    }
}

export class ChargeTenantError extends BaseError {}
