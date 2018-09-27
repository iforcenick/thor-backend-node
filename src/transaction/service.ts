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
import {ApiServer} from '../server';
import {event} from '../dwolla';
import {MailerService} from '../mailer';
import {Logger} from '../logger';

@AutoWired
export class TransactionService extends db.ModelService<models.Transaction> {
    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private mailer: MailerService;
    protected modelType = models.Transaction;
    public transferService: TransferService;
    protected tenantService: TenantService;
    protected userService: UserService;

    constructor(@Inject transferService: TransferService,
                @Inject tenantService: TenantService,
                @Inject userService: UserService) {
        super();
        this.transferService = transferService;
        this.userService = userService;
        this.tenantService = tenantService;
    }

    tenantContext(query) {
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

    async getForUser({page = 1, limit}: { page?: number; limit?: number },
                     {userId, startDate, endDate, status}: { userId: string; startDate?: string; endDate?: string; status?: string }) {
        limit = this.paginationLimit(limit);
        const query = this.modelType.query();
        const knex = ApiServer.db;
        query.where({userId});
        query.page(page - 1, limit);
        const eagerObject = {
            job: {$modify: ['job']},
        };
        const eagerFilters = {
            job: builder => {
                builder.select(['id', 'value', 'name', 'description']);
            },
        };
        if (startDate && endDate) {
            query.whereRaw('"transactions"."createdAt" between ? and ( ? :: timestamptz + INTERVAL \'1 day\')', [
                startDate,
                endDate,
            ]);
        }
        if (status) {
            query.where('transactions.status', status);
        }
        query
            .join('jobs', 'transactions.jobId', 'jobs.id')
            .select(['transactions.*', knex.raw('transactions.quantity * jobs.value as value')]);
        query.eager(eagerObject, eagerFilters);
        query.orderBy(`${db.Tables.transactions}.createdAt`, 'desc');
        const result = await this.tenantContext(query);
        return new db.Paginated(new db.Pagination(page, limit, result.total), result.results);
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

    async getStatistics({startDate, endDate}: { startDate: string; endDate: string }) {
        // TODO: I think it should be moved to stats service, also is it injection safe?
        const base = ApiServer.db
            .from('transactions')
            .where({'transactions.tenantId': this.getTenantId()})
            .whereRaw('"transactions"."createdAt" between ? and ( ? :: timestamptz + INTERVAL \'1 day\')', [
                startDate,
                endDate,
            ]);
        const totalQuery = base.count('* as total').first();
        const a = await Promise.all([totalQuery]);
        const [{total}] = a;
        // TODO: missing stats response definition
        return {approved: '0', postponed: '0', total};
    }

    async getPeriodStats(startDate: Date, endDate: Date, page?: number, limit?: number, status?: string) {
        const query = this.tenantContext(this.modelType.query());
        query.joinRelation(models.Relations.job);
        models.Transaction.periodFilter(query, startDate, endDate, status);
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
}
