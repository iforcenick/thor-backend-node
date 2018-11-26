import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {transaction} from 'objection';
import {RoleService} from '../user/role/service';
import * as dwolla from '../dwolla';
import moment from 'moment';
import {ValidationError} from '../errors';
import {FundingSource} from '../foundingSource/models';
import {Invitation} from '../invitation/models';
import {Profile} from './models';
import * as objection from 'objection';

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

    async createProfile(profile: models.Profile, roles: Array<any>, trx: objection.Transaction, baseProfile?: boolean, tenantId?) {
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

    async updateWithDwolla(profile: models.Profile, trx?: objection.Transaction): Promise<any> {
        try {
            const customer = dwolla.customer.factory(profile);
            customer.status = profile.dwollaStatus;
            customer.type = profile.dwollaType;
            await this.dwollaClient.updateCustomer(profile.dwollaUri, customer.updateableFields());
            return await this.update(profile, trx);
        } catch (err) {
            throw err;
        }
    }

    async addFundingSource(profile: models.Profile, fundingSource: FundingSource, trx: objection.Transaction): Promise<any> {
        return await profile.$relatedQuery(models.Relations.fundingSources, trx).relate(fundingSource.id);
    }

    async getByResourceLink(id: string) {
        return await this.getOneBy('dwollaUri', id);
    }

    async setRoleForProfile(profile: Profile, roleId: string, trx: objection.Transaction) {
        await profile.$relatedQuery(models.Relations.roles, trx).relate(roleId);
    }

    async getByEmails(emails: string[]): Promise<Array<Profile>> {
        return this.useTenantContext(Profile.query())
            .whereIn('email', emails);
    }

    async getByExternalIds(externalIds: Array<string>): Promise<Array<Profile>> {
    return this.useTenantContext(Profile.query())
        .whereIn('externalId', externalIds);
    }
}
