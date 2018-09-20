import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {transaction} from 'objection';
import {RoleService} from '../user/role/service';
import * as dwolla from '../dwolla';
import {Logger} from '../logger';
import moment from 'moment';
import {ValidationError} from '../errors';

@AutoWired
export class ProfileService extends db.ModelService<models.Profile> {
    protected modelType = models.Profile;
    protected roleService: RoleService;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private logger: Logger;

    constructor(@Inject roleService: RoleService) {
        super();
        // TODO: add model specific profile filter
        this.roleService = roleService;
    }

    static validateAge(profile) {
        const dateOfBirth = profile['dateOfBirth'];
        if (!dateOfBirth) return;
        const age = moment().diff(dateOfBirth, 'years');
        if (age >= 18) return;
        throw new ValidationError('users is too young');
    }

    async createProfile(profile: models.Profile, roles: Array<any>, trx?: transaction<any>, baseProfile?: boolean, tenantId?) {
        if (!baseProfile) {
            profile.tenantId = tenantId || this.getTenantId();
        }

        profile = await this.insert(profile, trx);
        if (!baseProfile) {
            for (const role of roles) {
                await profile.$relatedQuery(models.Relations.roles, trx).relate(role.id);
            }
        }

        return profile;
    }

    async updateWithDwolla(profile: models.Profile, trx?: transaction<any>): Promise<any> {
        try {
            await this.dwollaClient.authorize();
            await this.dwollaClient.updateCustomer(profile);
            return await this.update(profile, trx);
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }
}
