import {AutoWired} from 'typescript-ioc';
import * as db from '../db';
import * as models from './models';

@AutoWired
export class TenantService extends db.ModelService<models.Tenant> {
    protected setModelType() {
        this.modelType = models.Tenant;
    }

    useTenantContext(query) { // roles are not tenant specific
        return query;
    }
}
