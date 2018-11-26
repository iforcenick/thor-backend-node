import * as db from '../db';
import {FundingSource} from './models';
import * as objection from 'objection';
import {transaction} from 'objection';
import {AutoWired} from 'typescript-ioc';

@AutoWired
export class FundingSourceService extends db.ModelService<FundingSource> {
    async insert(entity: FundingSource, trx?: objection.Transaction): Promise<FundingSource> {
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
}