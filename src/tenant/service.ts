import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';

@AutoWired
export class TenantService extends db.ModelService<models.Tenant> {
    protected setModelType() {
        this.modelType = models.Tenant;
    }
}
