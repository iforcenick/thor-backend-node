import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../../db';
import {Logger} from '../../logger';
import {Config} from '../../config';
import * as context from '../../context';

@AutoWired
export class RoleService extends db.ModelService<models.Role> {
    protected modelType = models.Role;

    constructor(@Inject config: Config, @Inject logger: Logger, @Inject tenantContext: context.TenantContext) {
        super(config, logger, tenantContext);
    }

    async find(role: models.Types) {
        return this.modelType.query().findOne({name: role});
    }
}
