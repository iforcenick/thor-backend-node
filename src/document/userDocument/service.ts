import * as objection from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Config} from '../../config';
import * as db from '../../db';
import {UserDocument} from './models';

@AutoWired
export class UserDocumentService extends db.ModelService<UserDocument> {
    @Inject protected config: Config;

    protected setModelType() {
        this.modelType = UserDocument;
    }

    setConditions(query) {
        this.setBasicConditions(query);
    }

    setBasicConditions(query) {
        query.whereNull(`${this.modelType.tableName}.deletedAt`);
    }

    setListConditions(query) {
        this.setConditions(query);
    }

    async insert(userDocument: UserDocument, trx?: objection.Transaction): Promise<UserDocument> {
        return await super.insert(userDocument, trx);
    }
}
