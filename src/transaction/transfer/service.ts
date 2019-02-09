import * as objection from 'objection';
import {AutoWired} from 'typescript-ioc';
import * as db from '../../db';
import * as models from './models';

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

    /**
     * find the transfer using the payments id
     * no tenant context
     *
     * @param {string} id
     * @returns
     * @memberof TransferService
     */
    async getByPaymentsId(id: string) {
        const query = this.modelType.query().findOne({['paymentsId']: id});
        return await query;
    }
}
