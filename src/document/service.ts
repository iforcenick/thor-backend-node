import {AutoWired} from 'typescript-ioc';
import {Document, Relations} from './models';
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

    async insert(document: Document, trx?: objection.Transaction): Promise<Document> {
        return await super.insert(document, trx);
    }

    async hasUserDocuments(id: string) {
        const query = this.modelType
            .query()
            .where({[`${db.Tables.usersDocuments}.documentId`]: id})
            .joinRelation(`${Relations.usersDocuments}`)
            .count()
            .first();
        const {count} = await query;
        return parseInt(count) > 0;
    }
}
