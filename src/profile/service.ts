import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {transaction} from 'objection';
import {RoleService} from '../user/role/service';
import * as dwolla from '../dwolla';
import moment from 'moment';
import {ValidationError} from '../errors';
import {Logger} from '../logger';
import {Config} from '../config';
import * as context from '../context';
import {FundingSource} from '../foundingSource/models';

@AutoWired
export class ProfileService extends db.ModelService<models.Profile> {
    protected roleService: RoleService;
    protected dwollaClient: dwolla.Client;

    constructor(@Inject roleService: RoleService, @Inject dwollaClient: dwolla.Client,
                @Inject config: Config, @Inject logger: Logger,
                @Inject tenantContext: context.TenantContext) {
        super(config, logger, tenantContext);
        this.roleService = roleService;
        this.dwollaClient = dwollaClient;
    }

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
            await this.dwollaClient.updateCustomer(profile.dwollaUri, profile);
            return await this.update(profile, trx);
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

    async addFundingSource(profile: models.Profile, fundingSource: FundingSource, trx: transaction<any>): Promise<any> {
        return await profile.$relatedQuery(models.Relations.fundingSources, trx).relate(fundingSource.id);
    }
}
