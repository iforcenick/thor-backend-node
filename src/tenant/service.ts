import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {Logger} from '../logger';
import {Config} from '../config';
import * as context from '../context';

@AutoWired
export class TenantService extends db.ModelService<models.Tenant> {
    constructor(@Inject config: Config, @Inject logger: Logger, @Inject tenantContext: context.TenantContext) {
        super(config, logger, tenantContext);
    }

    protected setModelType() {
        this.modelType = models.Tenant;
    }
}
