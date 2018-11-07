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
import {event} from '../dwolla';
import * as models from './models';
import {Statuses, Transaction, TransactionRequest} from './models';
import {MailerService} from '../mailer';
import {Logger} from '../logger';
import {FundingSource} from '../foundingSource/models';
import {Config} from '../config';
import {JobService} from '../job/service';
import {Job} from '../job/models';
import * as _ from 'lodash';

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
        this.transactionService.setRequestContext(this.context);
        this.transferService.setRequestContext(this.context);
        this.userService.setRequestContext(this.context);

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
        await this.dwollaClient.authorize();
        const result = await this.dwollaClient.cancelTransfer(_transaction.transfer.externalId);

        if (result) {
            await updateStatusLogic.execute(_transaction, models.Statuses.cancelled);
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

    async execute(transactions: Array<models.Transaction>, user, admin: users.User): Promise<any> {
        this.transactionService.setRequestContext(this.context);
        this.userService.setRequestContext(this.context);
        this.transferService.setRequestContext(this.context);
        this.fundingService.setRequestContext(this.context);

        const defaultFunding: FundingSource = await this.fundingService.getDefault(user.id);
        if (!defaultFunding) {
            throw new models.InvalidTransferDataError('Bank account not configured for recipient');
        }

        let value = 0;
        for (const trans of transactions) {
            trans.status = models.Statuses.processing;
            value += Number(trans.value);
        }

        let transfer = new Transfer();
        transfer.adminId = admin.id;
        transfer.status = Statuses.new;
        transfer.destinationUri = defaultFunding.dwollaUri;
        transfer.sourceUri = this.config.get('dwolla.masterFunding');
        transfer.value = value;

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

@AutoWired
export class CreateTransactionTransferLogic extends Logic {
    @Inject private transactionService: TransactionService;
    @Inject private userService: UserService;
    @Inject private transferService: TransferService;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private config: Config;

    async execute(id: string): Promise<any> {
        this.transactionService.setRequestContext(this.context);
        this.userService.setRequestContext(this.context);
        this.transferService.setRequestContext(this.context);

        const transaction = await this.transactionService.get(id);
        if (!transaction) {
            throw new Errors.NotFoundError();
        }

        try {
            const admin = await this.userService.get(this.context.getUser().id);

            if (!transaction.transferId) {
                const user = await this.userService.get(transaction.userId);
                const logic = new PrepareTransferLogic(this.context);
                transaction.transfer = await logic.execute([transaction], user, admin);
            } else {
                transaction.transfer = await this.transferService.get(transaction.transferId);
            }

            if (transaction.transfer.status !== transfer.Statuses.new) {
                throw new Errors.NotAcceptableError('Transfer already pending');
            }

            await this.createExternalTransfer(transaction);
        } catch (e) {
            if (e instanceof models.InvalidTransferDataError || e instanceof Errors.NotAcceptableError) {
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
            await this.dwollaClient.authorize();
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
        this.transactionService.setRequestContext(this.context);
        this.userService.setRequestContext(this.context);

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
            const logic = new PrepareTransferLogic(this.context);
            const transfer = await logic.execute(transactions, user, admin);

            await this.createExternalTransfer(transfer, transactions);
            // TODO: send email
            return transfer;
        } catch (e) {
            if (e instanceof models.InvalidTransferDataError || e instanceof Errors.NotAcceptableError) {
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
            await this.dwollaClient.authorize();
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
        this.transactionService.setRequestContext(this.context);
        this.jobService.setRequestContext(this.context);
        this.userService.setRequestContext(this.context);
        this.fundingService.setRequestContext(this.context);

        const user = await this.userService.get(data.userId);
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