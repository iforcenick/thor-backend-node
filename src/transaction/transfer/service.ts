import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../../db';
import {transaction} from 'objection';

@AutoWired
export class TransferService extends db.ModelService<models.Transfer> {
    protected modelType = models.Transfer;

    async createTransfer(transfer: models.Transfer, trx?: transaction<any>): Promise<models.Transfer> {
        return await this.insert(transfer, trx);
    }
}
