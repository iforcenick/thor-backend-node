import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';

@AutoWired
export class TenantService extends db.ModelService<models.Tenant> {
    protected modelType = models.Tenant;
}
