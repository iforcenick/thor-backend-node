import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {transaction} from 'objection';

@AutoWired
export class JobService extends db.ModelService<models.Job> {
    async useTenantContext(query) {
        return await query.where('tenantId', this.getTenantId());
    }

    async insert(data: models.Job, trx?: transaction<any>): Promise<models.Job> {
        data.tenantId = this.getTenantId();
        return await super.insert(data, trx);
    }

    protected setModelType() {
        this.modelType = models.Job;
    }
}
