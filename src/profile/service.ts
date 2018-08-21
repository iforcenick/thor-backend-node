import { AutoWired, Inject } from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import { transaction } from 'objection';
import * as role from '../user/role';
import { RoleService } from '../user/role/service';

@AutoWired
export class ProfileService extends db.ModelService<models.Profile> {
    protected modelType = models.Profile;
    protected roleService: RoleService;

    constructor(@Inject roleService: RoleService) {
        super();
        // TODO: add model specific profile filter
        this.roleService = roleService;
    }

    async createProfile(
        profile: models.Profile,
        roles: Array<any>,
        trx?: transaction<any>
    ) {
        profile.tenantId = this.getTenantId();
        profile = await this.insert(profile, trx);

        for (const role of roles) {
            await profile
                .$relatedQuery(models.Relations.roles, trx)
                .relate(role.id);
        }

        return profile;
    }

    async createBaseProfile(profile: models.Profile, trx?: transaction<any>) {
        profile = await this.insert(profile, trx);
        const roleEntity = await this.roleService.find(
            role.models.Types.customer
        );

        await profile
            .$relatedQuery(models.Relations.roles, trx)
            .relate(roleEntity.id);

        return profile;
    }
}
