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

    async getByDwollaUri(uri: string) {
        const query = this.getOneBy('dwollaUri', uri);
        return await query;
    }

    async setRoleForProfile(profile: Profile, roleId: string, trx: objection.Transaction) {
        await profile.$relatedQuery(models.Relations.roles, trx).relate(roleId);
    }

    async getByEmails(emails: string[]): Promise<Array<Profile>> {
        const query = this.listQuery();
        return query.whereIn('email', emails);
    }

    async getByExternalIds(externalIds: Array<string>): Promise<Array<Profile>> {
        const query = this.listQuery();
        return query.whereIn('externalId', externalIds);
    }
}
