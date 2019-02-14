import {AutoWired} from 'typescript-ioc';
import {Document} from './models';
import * as db from '../db';
import * as objection from 'objection';

@AutoWired
export class DocumentService extends db.ModelService<Document> {
    protected setModelType() {
        this.modelType = Document;
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

    async insert(transaction: Document, trx?: objection.Transaction): Promise<Document> {
        return await super.insert(transaction, trx);
    }
}
