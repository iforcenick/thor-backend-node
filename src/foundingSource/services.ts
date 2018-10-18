import * as db from '../db';
import {FundingSource} from './models';
import {transaction} from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Config} from '../config';
import {Logger} from '../logger';
import * as context from '../context';
import * as Errors from 'typescript-rest/dist/server-errors';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';

@AutoWired
export class FundingSourceService extends db.ModelService<FundingSource> {
    private profileService: ProfileService;
    private userService: UserService;
    constructor(@Inject config: Config, @Inject logger: Logger,
                @Inject tenantContext: context.TenantContext, @Inject profileService: ProfileService, @Inject userSerivce: UserService) {
        super(config, logger, tenantContext);

        this.profileService = profileService;
        this.userService = userSerivce;
    }

    async insert(entity: FundingSource, trx?: transaction<any>): Promise<FundingSource> {
        entity.tenantId = this.getTenantId();
        return super.insert(entity, trx);
    }

    protected setModelType() {
        this.modelType = FundingSource;
    }

    async setDefault(fundingSource: FundingSource) {
        const query = this.useTenantContext(this.getListOptions(this.modelType.query()));

        query.where(`${db.Tables.fundingSources}.profileId`, fundingSource.profileId);
        const fundingSources = await query;

        await transaction(this.transaction(), async trx => {
            for (const fs of fundingSources) {
                fs.isDefault = false;
                await this.update(fs, trx);
            }
            fundingSource.isDefault = true;
            return await this.update(fundingSource, trx);
        });
    }

    async getDefault(userId: string) {
        const user = await this.userService.get(userId);
        const query = this.useTenantContext(this.getOptions(this.modelType.query()));
        query.where(`${db.Tables.fundingSources}.profileId`, user.tenantProfile.id)
            .andWhere('isDefault', true).first();

        const defaultFundingSource = await query;
        return defaultFundingSource;
    }

    async getAllFundingSource(userId: string): Promise<Array<FundingSource>> {
        const user = await this.userService.get(userId);
        const query = this.useTenantContext(this.getOptions(this.modelType.query()));
        query.where(`${db.Tables.fundingSources}.profileId`, user.tenantProfile.id);

        return await query;
    }
}