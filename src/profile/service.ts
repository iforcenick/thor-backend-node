import * as objection from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Config} from '../config';
import * as crypto from '../crypto';
import * as db from '../db';
import {FundingSource} from '../fundingSource/models';
import {Profile} from './models';
import * as models from './models';
import * as payments from '../payment';
import {RoleService} from '../user/role/service';

@AutoWired
export class ProfileService extends db.ModelService<models.Profile> {
    @Inject protected roleService: RoleService;
    @Inject protected paymentClient: payments.PaymentClient;
    @Inject protected config: Config;

    protected setModelType() {
        this.modelType = models.Profile;
    }

    async updateWithDwolla(profile: models.Profile, trx?: objection.Transaction): Promise<any> {
        try {
            const customer = payments.customers.factory(profile);
            customer.status = profile.paymentsStatus;
            customer.type = profile.paymentsType;
            await this.paymentClient.updateCustomer(profile.paymentsUri, customer.updateableFields());
            return await this.update(profile, trx);
        } catch (err) {
            throw err;
        }
    }

    async addFundingSource(
        profile: models.Profile,
        fundingSource: FundingSource,
        trx: objection.Transaction,
    ): Promise<any> {
        return await profile.$relatedQuery(models.Relations.fundingSources, trx).relate(fundingSource.id);
    }

    /**
     * Get the profile using their payments provider uri
     *
     * @param {string} uri - payments provider uri
     * @param {boolean} [useTenantContext=false]
     * @returns
     * @memberof ProfileService
     */
    async getByPaymentsUri(uri: string) {
        const query = this.modelType.query().findOne({['paymentsUri']: uri});
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

    encryptField(value) {
        return crypto.aesDecrypt(value, this.config.get('authorization.payloadSecret'));
    }

    decryptField(value) {
        return crypto.aesDecrypt(value, this.config.get('authorization.payloadSecret'));
    }
}
