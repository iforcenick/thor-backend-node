import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';

@AutoWired
export class TransactionService extends db.ModelService<models.Transaction> {
    protected modelType = models.Transaction;

    async tenantContext(query) {
        return await query.where('tenantId', this.getTenantId());
    }

    getOptions(query) {
        query.eager(`${models.Relations.job}(tenant)`, {
            tenant: (builder) => {
                builder.where('tenantId', this.getTenantId());
            }
        });

        return query;
    }

    getListOptions(query) {
        query.eager(`${models.Relations.job}(tenant)`, {
            tenant: (builder) => {
                builder.where('tenantId', this.getTenantId());
            }
        });

        return query;
    }

    async createTransaction(transaction: models.Transaction): Promise<models.Transaction> {
        transaction.tenantId = this.getTenantId();
        transaction.status = models.Statuses.new;
        return await this.insert(transaction);
    }
}
