import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../../db';
import {transaction} from 'objection';
import * as objection from 'objection';

@AutoWired
export class TransferService extends db.ModelService<models.Transfer> {
    async createTransfer(transfer: models.Transfer, trx?: objection.Transaction): Promise<models.Transfer> {
        return await this.insert(transfer, trx);
    }

    protected setModelType() {
        this.modelType = models.Transfer;
    }

    /**
     * find the transfer using the payments uri
     * no tenant context
     *
     * @param {string} uri
     * @returns
     * @memberof TransferService
     */
    async getByPaymentsUri(uri: string) {
        const query = this.modelType.query().findOne({['paymentsUri']: uri});
        return await query;
    }
}
