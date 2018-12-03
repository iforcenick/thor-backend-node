import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../../db';

@AutoWired
export class RoleService extends db.ModelService<models.Role> {
    async find(role: models.Types) {
        return this.modelType.query().findOne({name: role});
    }

    protected setModelType() {
        this.modelType = models.Role;
    }

    useTenantContext(query) { // roles are not tenant specific
        return query;
    }
}
