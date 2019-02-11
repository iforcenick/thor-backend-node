import * as _ from 'lodash';
import * as objection from 'objection';
import {transaction} from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import {BaseError} from '../api';
import {Config} from '../config';
import * as dwolla from '../dwolla';
import {DwollaRequestError} from '../dwolla';
import {Logger} from '../logger';
import {Logic} from '../logic';
import {GetDefaultFundingSourceLogic} from '../fundingSource/logic';
import {CreateJobLogic} from '../job/logic';
import {MailerService} from '../mailer';
import {Transfer} from './transfer/models';
import {Job, JobRequest} from '../job/models';
import {User} from '../user/models';
import * as users from '../user/models';
import {Tenant} from '../tenant/models';
import {Statuses, Transaction, TransactionPatchRequest, InvalidTransferDataError} from './models';
import {FundingSource, Statuses as VerificationStatuses} from '../fundingSource/models';
import {FundingSourceService} from '../fundingSource/services';
import {TransactionService} from './service';
import {UserService} from '../user/service';
import {TransferService} from './transfer/service';
import {JobService} from '../job/service';
import {TenantService} from '../tenant/service';

@AutoWired
export class UpdateTransactionStatusLogic extends Logic {
    @Inject private transactionService: TransactionService;
    @Inject private transferService: TransferService;
    @Inject private userService: UserService;
    @Inject private mailer: MailerService;
    @Inject private logger: Logger;
    @Inject private fundingSourceService: FundingSourceService;
    @Inject private tenantService: TenantService;

    async execute(transactions: Array<Transaction>, status: string): Promise<any> {
        if (transactions[0].status === status) return;

        await transaction(this.transactionService.transaction(), async trx => {
            for (let index = 0; index < transactions.length; index++) {
                const transaction = transactions[index];
                transaction.status = status;
                transaction.transfer.status = status;

                await this.transactionService.update(transaction, trx);
                await this.transferService.update(transaction.transfer, trx);

                // send all the contractor emails
                try {
                    const user = await this.userService.get(transaction.userId);
                    const tenant = await this.tenantService.get(transaction.tenantId);
                    switch (status) {
                        case Statuses.processing:
                            await this.mailer.sendCustomerTransferCreatedReceiver(user, tenant, transaction);
                            break;
                        case Statuses.processed:
                            await this.mailer.sendCustomerTransferCompletedReceiver(user, tenant, transaction);
                            break;
                        case Statuses.failed:
                            await this.mailer.sendCustomerTransferFailedReceiver(user, tenant, transaction);
                            break;
                        case Statuses.cancelled:
                            await this.mailer.sendCustomerTransferCancelledReceiver(user, tenant, transaction);
                            break;
                        default:
                            break;
                    }
                } catch (error) {
                    // don't abort if email was not sent
                    this.logger.error(error.message);
                }
            }
        });

        // send the admin email
        try {
            const user = await this.userService.get(transactions[0].userId);
            const admin = await this.userService.get(transactions[0].adminId);
            const destination = await this.fundingSourceService.getByPaymentsUri(transactions[0].transfer.destinationUri);
            switch (status) {
                case Statuses.processing:
                    await this.mailer.sendCustomerTransferCreatedSender(user, admin, transactions[0], destination);
                    break;
                case Statuses.processed:
                    await this.mailer.sendCustomerTransferCompletedSender(user, admin, transactions[0], destination);
                    break;
                case Statuses.failed:
                    await this.mailer.sendCustomerTransferFailedSender(user, admin, transactions[0], destination);
                    break;
                case Statuses.cancelled:
                    await this.mailer.sendCustomerTransferCancelledSender(user, admin, transactions[0], destination);
                    break;
                default:
                    break;
            }
        } catch (error) {
            // don't abort if email was not sent
            this.logger.error(error.message);
        }
    }
}

@AutoWired
export class CancelTransferLogic extends Logic {
    @Inject private transactionService: TransactionService;
    @Inject private dwollaClient: dwolla.Client;

    async execute(transferId: string): Promise<any> {
        const transactions: Array<Transaction> = await this.transactionService.getByTransferId(transferId);
        if (transactions.length === 0) {
            throw new Errors.NotFoundError('transfer could not be found');
        }
        const logic = new UpdateTransactionStatusLogic(this.context);
        const result = await this.dwollaClient.cancelTransfer(transactions[0].transfer.paymentsUri);

        if (result) {
            await logic.execute(transactions, Statuses.cancelled);
        }
    }
}

@AutoWired
export class ChargeTenantLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private tenantService: TenantService;
    @Inject private transferService: TransferService;
    @Inject private config: Config;

    async execute(value: number, admin: User): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(this.context.getTenantId());
        if (!tenant.fundingSourceUri) {
            throw new ChargeTenantError('Tenant funding source not found');
        }

        if (tenant.fundingSourceStatus != VerificationStatuses.verified) {
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
            transfer.paymentsUri = await this.dwollaClient.createTransfer(dwollaTransfer);
            const _transfer = await this.dwollaClient.getTransfer(transfer.paymentsUri);
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
    @Inject private tenantService: TenantService;
    @Inject private config: Config;

    async execute(transactions: Array<Transaction>, user, admin: users.User, value: number): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(this.context.getTenantId());
        const logic = new GetDefaultFundingSourceLogic(this.context);
        const defaultFunding: FundingSource = await logic.execute(user.id);
        if (!defaultFunding) {
            throw new InvalidTransferDataError('Bank account not configured for recipient');
        }

        let transfer = new Transfer();
        transfer.adminId = admin.id;
        transfer.status = Statuses.new;
        transfer.destinationUri = defaultFunding.paymentsUri;
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

const calculateTransactionsValue = (transactions: Array<Transaction>) => {
    return transactions.reduce((total, trans) => {
        return total + Number(trans.value);
    }, 0);
};

@AutoWired
export class CreateTransactionsTransferLogic extends Logic {
    @Inject private transactionService: TransactionService;
    @Inject private userService: UserService;
    @Inject private transferService: TransferService;
    @Inject private dwollaClient: dwolla.Client;

    async execute(data: Array<string>): Promise<any> {
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
                e instanceof InvalidTransferDataError ||
                e instanceof Errors.NotAcceptableError ||
                e instanceof ChargeTenantError
            ) {
                throw new Errors.NotAcceptableError(e.message);
            }

            throw new Errors.InternalServerError(e.message);
        }
    }

    private async createExternalTransfer(_transfer: Transfer, transactions: Array<Transaction>) {
        const transfer = dwolla.transfer.factory({});
        transfer.setSource(_transfer.sourceUri);
        transfer.setDestination(_transfer.destinationUri);
        transfer.setAmount(_transfer.value);
        transfer.setCurrency('USD');

        // TODO: better error handling
        try {
            _transfer.paymentsUri = await this.dwollaClient.createTransfer(transfer);
            const _dwollaTransfer = await this.dwollaClient.getTransfer(_transfer.paymentsUri);
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
    @Inject private jobService: JobService;

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
    @Inject private transactionService: TransactionService;

    async execute(userId: string, jobData: JobRequest, value: number, externalId?: string): Promise<any> {
        const trx = this.transactionService.transaction();
        const jobLogic = new CreateJobLogic(this.context);
        const transactionLogic = new CreateTransactionLogic(this.context);
        const job = await jobLogic.execute(jobData, true, trx);
        return await transactionLogic.execute(userId, value, job, externalId);
    }
}

@AutoWired
export class CreateTransactionLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private transactionService: TransactionService;

    async execute(
        userId: string,
        value: number,
        job: Job,
        externalId?: string,
        trx?: objection.Transaction,
    ): Promise<any> {
        let user: users.User = null;
        if (externalId) {
            user = await this.userService.findByExternalIdAndTenant(externalId, this.context.getTenantId());
        } else {
            user = await this.userService.get(userId);
        }

        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        if (!user.isContractor()) {
            throw new Errors.NotAcceptableError('User is not a contractor');
        }

        const logic = new GetDefaultFundingSourceLogic(this.context);
        const defaultFunding = await logic.execute(user.id);
        if (!defaultFunding) {
            throw new Errors.NotAcceptableError('User does not have a bank account');
        }

        return await transaction(this.transactionService.transaction(trx), async _trx => {
            // override the base job value if a value was provided in the request
            if (!value) {
                value = job.value;
            }

            const transactionEntity = Transaction.factory({
                adminId: this.context.getUserId(),
                userId: user.id,
                jobId: job.id,
                value,
            });
            const transactionFromDb = await this.transactionService.insert(transactionEntity, _trx);
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

@AutoWired
export class GetTransactionLogic extends Logic {
    @Inject private transactionService: TransactionService;

    async execute(id): Promise<any> {
        const transaction = await this.transactionService.get(id);
        if (!transaction) {
            throw new Errors.NotFoundError();
        }
        return transaction;
    }
}

@AutoWired
export class GetUserTransactionsLogic extends Logic {
    @Inject private transactionService: TransactionService;

    async execute(userId, page, limit, startDate, endDate, status): Promise<any> {
        const filter = builder => {
            Transaction.filter(builder, startDate, endDate, status, userId);
        };

        return await this.transactionService.listPaginated(page, limit, filter);
    }
}

export class ChargeTenantError extends BaseError {}
