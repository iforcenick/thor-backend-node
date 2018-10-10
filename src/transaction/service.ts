import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import * as users from '../user/models';
import * as transfers from './transfer/models';
import {TransferService} from './transfer/service';
import * as dwolla from '../dwolla';
import {TenantService} from '../tenant/service';
import {UserService} from '../user/service';
import {raw, transaction} from 'objection';
import {event} from '../dwolla';
import {MailerService} from '../mailer';
import {Logger} from '../logger';
import * as context from '../context';
import {Config} from '../config';

@AutoWired
export class TransactionService extends db.ModelService<models.Transaction> {
    protected dwollaClient: dwolla.Client;
    protected mailer: MailerService;
    public transferService: TransferService;
    protected tenantService: TenantService;
    protected userService: UserService;

    constructor(@Inject transferService: TransferService,
                @Inject tenantService: TenantService,
                @Inject userService: UserService,
                @Inject dwollaClient: dwolla.Client,
                @Inject mailer: MailerService,
                @Inject config: Config,
                @Inject logger: Logger,
                @Inject tenantContext: context.TenantContext) {
        super(config, logger, tenantContext);
        this.dwollaClient = dwollaClient;
        this.mailer = mailer;
        this.transferService = transferService;
        this.userService = userService;
        this.tenantService = tenantService;
    }

    useTenantContext(query) {
        return query.where(`${db.Tables.transactions}.tenantId`, this.getTenantId());
    }

    getOptions(query) {
        query.eager({[models.Relations.job]: true, [models.Relations.transfer]: true});

        return query;
    }

    getListOptions(query) {
        query.eager({[models.Relations.job]: true});

        return query;
    }

    async insert(transaction: models.Transaction, trx?: transaction<any>): Promise<models.Transaction> {
        delete transaction.job;
        transaction.tenantId = this.getTenantId();
        transaction.status = models.Statuses.new;
        return await super.insert(transaction, trx);
    }

    async update(transaction: models.Transaction, trx?: transaction<any>): Promise<models.Transaction> {
        delete transaction.job;
        return await super.update(transaction, trx);
    }

    async prepareTransfer(_transaction: models.Transaction, admin: users.User): Promise<transfers.Transfer> {
        const tenant = await this.tenantService.get(_transaction.tenantId);
        const user = await this.userService.get(_transaction.userId);

        if (!user.tenantProfile.dwollaSourceUri) {
            throw new models.InvalidTransferData('Bank account not configured for recipient');
        }
        let transfer = new transfers.Transfer();
        transfer.adminId = admin.id;
        transfer.status = transfers.Statuses.new;
        transfer.destinationUri = user.tenantProfile.dwollaSourceUri;
        transfer.sourceUri = tenant.dwollaUri;
        transfer.value = Number(_transaction.value);
        _transaction.status = models.Statuses.processing;
        await transaction(this.transaction(), async trx => {
            transfer = await this.transferService.createTransfer(transfer, trx);
            _transaction.transferId = transfer.id;
            await this.update(_transaction, trx);
        });
        _transaction.transfer = transfer;

        return transfer;
    }

    async createExternalTransfer(_transaction: models.Transaction) {
        const transfer = dwolla.transfer.factory({});
        transfer.setSource(_transaction.transfer.sourceUri);
        transfer.setDestination(_transaction.transfer.destinationUri);
        transfer.setAmount(_transaction.transfer.value);
        transfer.setCurrency('USD');

        try {
            await this.dwollaClient.authorize();
            _transaction.transfer.externalId = await this.dwollaClient.createTransfer(transfer);
            const _transfer = await this.dwollaClient.getTransfer(_transaction.transfer.externalId);
            await this.updateTransactionStatus(_transaction, _transfer.status);
        } catch (e) {
            await this.updateTransactionStatus(_transaction, models.Statuses.failed);
            throw e;
        }
    }

    async getPeriodStats(startDate: Date, endDate: Date, page?: number, limit?: number, status?: string) {
        const query = this.useTenantContext(this.modelType.query());
        query.joinRelation(models.Relations.job);
        models.Transaction.filter(query, startDate, endDate, status);
        query.select([
            raw(`sum(${db.Tables.transactions}.quantity * ${models.Relations.job}.value) as total`),
            raw(`count(distinct "${db.Tables.transactions}"."userId") as users`)
        ]);
        query.groupBy([`${db.Tables.transactions}.tenantId`]).first();
        const queryResult = await query;
        return queryResult || {total: '0', users: '0'};
    }

    async getDwollaByTransferExternalId(id: string) {
        // no tenat context for Dwolla
        const query = this.getOptions(this.modelType.query());
        query.rightJoinRelation(models.Relations.transfer).where(`${models.Relations.transfer}.externalId`, id);
        return await query.first();
    }

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

    async updateTransactionStatus(_transaction: models.Transaction, status: string) {
        await transaction(this.transaction(), async trx => {
            status = this.mapDwollaStatus(status);
            _transaction.status = status;
            _transaction.transfer.status = status;

            await this.update(_transaction, trx);
            await this.transferService.update(_transaction.transfer, trx);
        });

        // don't abort transaction if email was not send
        try {
            const user = await this.userService.get(_transaction.userId);

            if (status == models.Statuses.failed) {
                await this.mailer.sendTransferFailed(user, _transaction);
            } else if (status == models.Statuses.processed) {
                await this.mailer.sendTransferProcessed(user, _transaction);
            }
        } catch (e) {
            this.logger.error(e);
        }
    }

    async cancelTransaction(_transaction: models.Transaction) {
        try {
            await this.dwollaClient.authorize();
            const result = await this.dwollaClient.cancelTransfer(_transaction.transfer.externalId);

            if (result) {
                await this.updateTransactionStatus(_transaction, models.Statuses.cancelled);
            }
        } catch (e) {
            throw e;
        }
    }

    protected setModelType() {
        this.modelType = models.Transaction;
    }
}
