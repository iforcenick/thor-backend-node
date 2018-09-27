import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {transaction} from 'objection';
import {Logger} from '../logger';
import {Config} from '../config';
import * as context from '../context';

@AutoWired
export class JobService extends db.ModelService<models.Job> {
    protected modelType = models.Job;

    constructor(@Inject config: Config, @Inject logger: Logger, @Inject tenantContext: context.TenantContext) {
        super(config, logger, tenantContext);
    }

    async useTenantContext(query) {
        return await query.where('tenantId', this.getTenantId());
    }

    async insert(data: models.Job, trx?: transaction<any>): Promise<models.Job> {
        data.tenantId = this.getTenantId();
        return await super.insert(data, trx);
    }
}
