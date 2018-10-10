import * as db from '../db';
import {FundingSource} from './models';
import {transaction} from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Config} from '../config';
import {Logger} from '../logger';
import * as context from '../context';

@AutoWired
export class FoundingSourceService extends db.ModelService<FundingSource> {
    constructor(@Inject config: Config, @Inject logger: Logger,
                @Inject tenantContext: context.TenantContext) {
        super(config, logger, tenantContext);

    }
    async insert(entity: FundingSource, trx?: transaction<any>): Promise<FundingSource> {
        entity.tenantId = this.getTenantId();
        return super.insert(entity, trx);
    }

    protected setModelType() {
        this.modelType = FundingSource;
    }
}