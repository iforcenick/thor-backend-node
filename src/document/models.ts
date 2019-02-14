import * as db from '../db';
import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import {Tenant} from '../tenant/models';
import {UserDocument} from './userDocument/models';

export const enum Relations {
    tenant = 'tenant',
    usersDocuments = 'usersDocuments',
}

export class Document extends db.Model {
    static tableName = db.Tables.documents;
    name?: string = null;
    description?: string = null;
    fileName?: string = null;
    isRequired?: boolean = null;
    tenantId?: string = null;
    deletedAt?: Date = null;

    static get relationMappings() {
        return {
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: Tenant,
                join: {
                    from: `${db.Tables.documents}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
            [Relations.usersDocuments]: {
                relation: db.Model.HasManyRelation,
                modelClass: UserDocument,
                join: {
                    from: `${db.Tables.documents}.id`,
                    to: `${db.Tables.usersDocuments}.documentId`,
                },
            },
        };
    }
}

export class DocumentBaseModel extends Mapper {}

export class DocumentResponse extends DocumentBaseModel {
    id: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
    description: string = mapper.FIELD_STR;
    isRequired: boolean = mapper.FIELD_BOOLEAN;
    createdAt: Date = mapper.FIELD_DATE;
}

export interface PaginatedDocumentResponse extends PaginatedResponse {
    items: Array<DocumentResponse>;
}
