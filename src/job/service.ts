import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';

@AutoWired
export class JobService extends db.ModelService<models.Job> {
    protected modelType = models.Job;

    async tenantContext(query) {
        return await query.where('tenantId', this.getTenantId());
    }
}
