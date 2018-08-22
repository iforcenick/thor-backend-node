import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';

@AutoWired
export class JobService extends db.ModelService<models.Job> {
    protected modelType = models.Job;

    async tenantContext(query) {
        return await query.where('tenantId', this.getTenantId());
    }

    async createJob(data: models.Job) {
        data.tenantId = this.getTenantId();
        return this.insert(data);
    }
}
