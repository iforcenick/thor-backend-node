import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {transaction} from 'objection';
import {RoleService} from '../user/role/service';
import * as dwolla from '../dwolla';
import moment from 'moment';
import {ValidationError} from '../errors';
import {FundingSource} from '../foundingSource/models';

@AutoWired
export class ProfileService extends db.ModelService<models.Profile> {
    @Inject protected roleService: RoleService;
    @Inject protected dwollaClient: dwolla.Client;

    protected setModelType() {
        this.modelType = models.Profile;
    }

    static validateAge(profile) {
        const dateOfBirth = profile['dateOfBirth'];
        if (!dateOfBirth) return;
        const age = moment().diff(dateOfBirth, 'years');
        if (age >= 18) return;
        throw new ValidationError('users is too young');
    }

    async createProfile(profile: models.Profile, roles: Array<any>, trx: transaction<any>, baseProfile?: boolean, tenantId?) {
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
            const customer = dwolla.customer.factory(profile);
            customer.status = profile.dwollaStatus;
            customer.type = profile.dwollaType;
            await this.dwollaClient.updateCustomer(profile.dwollaUri, customer.updateableFields());
            return await this.update(profile, trx);
        } catch (err) {
            throw err;
        }
    }

    async addFundingSource(profile: models.Profile, fundingSource: FundingSource, trx: transaction<any>): Promise<any> {
        return await profile.$relatedQuery(models.Relations.fundingSources, trx).relate(fundingSource.id);
    }
}
