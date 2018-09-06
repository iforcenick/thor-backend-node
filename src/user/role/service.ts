import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../../db';

@AutoWired
export class RoleService extends db.ModelService<models.Role> {
    protected modelType = models.Role;

    constructor() {
        // TODO: add model specific role filter
        super();
    }

    async find(role: models.Types) {
        return this.modelType.query().findOne({name: role});
    }
}
