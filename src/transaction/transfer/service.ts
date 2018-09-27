import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../../db';
import {transaction} from 'objection';
import {Logger} from '../../logger';
import {Config} from '../../config';
import * as context from '../../context';

@AutoWired
export class TransferService extends db.ModelService<models.Transfer> {
    protected modelType = models.Transfer;

    constructor(@Inject config: Config, @Inject logger: Logger, @Inject tenantContext: context.TenantContext) {
        super(config, logger, tenantContext);
    }

    async createTransfer(transfer: models.Transfer, trx?: transaction<any>): Promise<models.Transfer> {
        return await this.insert(transfer, trx);
    }

    async getByExternalId(id: string) {
        return await this.getOneBy('externalId', id);
    }
}
