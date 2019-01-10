import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../../db';
import * as objection from 'objection';

@AutoWired
export class UserDocumentService extends db.ModelService<models.UserDocument> {
    protected setModelType() {
        this.modelType = models.UserDocument;
    }

    async insert(transaction: models.UserDocument, trx?: objection.Transaction): Promise<models.UserDocument> {
        return await super.insert(transaction, trx);
    }
}
