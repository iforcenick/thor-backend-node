import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {transaction} from 'objection';
import {RoleService} from '../user/role/service';

@AutoWired
export class ProfileService extends db.ModelService<models.Profile> {
    protected modelType = models.Profile;
    protected roleService: RoleService;

    constructor(@Inject roleService: RoleService) {
        super();
        // TODO: add model specific profile filter
        this.roleService = roleService;
    }

    async anonymize(profile: models.Profile, trx?: transaction<any>) {
        profile.firstName = null;
        profile.lastName = null;
        profile.email = null;
        profile.phone = null;
        profile.country = null;
        profile.state = null;
        profile.city = null;
        profile.postalCode = null;
        profile.address1 = null;
        profile.address2 = null;
        profile.dateOfBirth = null;
        profile.dwollaUri = null;
        profile.dwollaSourceUri = null;
        profile.dwollaStatus = null;
        profile.deletedAt = new Date();

        await this.update(profile, trx);
    }

    async createProfile(profile: models.Profile, roles: Array<any>, trx?: transaction<any>, baseProfile?: boolean) {
        if (!baseProfile) {
            profile.tenantId = this.getTenantId();
        }

        profile = await this.insert(profile, trx);

        for (const role of roles) {
            await profile.$relatedQuery(models.Relations.roles, trx).relate(role.id);
        }

        return profile;
    }
}
