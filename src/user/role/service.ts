import {AutoWired, Singleton} from 'typescript-ioc';
import * as models from './models';
import * as db from '../../db';

@Singleton
@AutoWired
export class RoleService extends db.ModelService<models.Role> {
    protected modelType = models.Role;

    async find(role: models.Types) {
        return this.tenantContext(this.modelType.query().findOne({name: role}));
    }
}