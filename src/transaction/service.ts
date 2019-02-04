import * as objection from 'objection';
import {AutoWired} from 'typescript-ioc';
import * as db from '../db';
import * as models from './models';

@AutoWired
export class TransactionService extends db.ModelService<models.Transaction> {
    setConditions(query) {
        query.eager({[models.Relations.job]: true, [models.Relations.transfer]: true});
        return query;
    }

    setListConditions(query) {
        query.eager({[models.Relations.job]: true});
        return query;
    }

    async insert(transaction: models.Transaction, trx?: objection.Transaction): Promise<models.Transaction> {
        delete transaction.job;
        transaction.status = models.Statuses.new;
        return await super.insert(transaction, trx);
    }

    async update(transaction: models.Transaction, trx?: objection.Transaction): Promise<models.Transaction> {
        delete transaction.job;
        return await super.update(transaction, trx);
    }

    async getPeriodStats(startDate: Date, endDate: Date, page?: number, limit?: number, status?: string) {
        const query = this.modelType.query();
        this.useTenantContext(query);
        query.joinRelation(models.Relations.job);
        models.Transaction.filter(query, startDate, endDate, status);
        query.select([
            objection.raw(`sum(${db.Tables.transactions}.value) as total`),
            objection.raw(`count(distinct "${db.Tables.transactions}"."userId") as users`),
        ]);
        query.groupBy([`${db.Tables.transactions}.tenantId`]).first();
        const queryResult = await query;
        return queryResult || {total: '0', users: '0'};
    }

    async getByTransferPaymentsUri(uri: string) {
        // no tenat context for Dwolla
        const query = this.modelType.query();
        this.setConditions(query);
        query.rightJoinRelation(models.Relations.transfer).where(`${models.Relations.transfer}.paymentsUri`, uri);
        return await query;
    }

    async getByTransferId(id: string) {
        // no tenat context for Dwolla
        const query = this.modelType.query();
        this.setConditions(query);
        query.rightJoinRelation(models.Relations.transfer).where(`${models.Relations.transfer}.id`, id);
        return await query;
    }

    protected setModelType() {
        this.modelType = models.Transaction;
    }

    async hasTransaction(jobId: string) {
        const query = this.modelType
            .query()
            .where({[`${db.Tables.transactions}.jobId`]: jobId})
            .joinRelation(`${models.Relations.job}`)
            .count()
            .first();
        const {count} = await query;
        return parseInt(count) > 0;
    }
}
