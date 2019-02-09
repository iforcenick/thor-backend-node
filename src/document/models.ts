import * as db from '../db';
import {PaginatedResponse, mapper} from '../api';
import * as tenant from '../tenant/models';
import * as user from '../user/models';
import {Mapper} from '../mapper';

export const enum Relations {
    user = 'users',
    tenant = 'tenants',
}

export class Document extends db.Model {
    static tableName = db.Tables.documents;
    name?: string = null;
    type?: string = null;
    userId?: string = null;
    tenantId?: string = null;

    static get relationMappings() {
        return {
            [Relations.user]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: user.User,
                join: {
                    from: `${db.Tables.documents}.userId`,
                    to: `${db.Tables.users}.id`,
                },
            },
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenant.Tenant,
                join: {
                    from: `${db.Tables.documents}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
        };
    }

    static filter(query, userId?: string, type?: string) {
        if (userId) {
            query.where(`${db.Tables.documents}.userId`, userId);
        }

        if (type) {
            query.where(`${db.Tables.documents}.type`, type);
        }
    }
}

export class DocumentBaseModel extends Mapper {}

export class DocumentResponse extends DocumentBaseModel {
    id: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
    type: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    createdOn: Date = mapper.FIELD_DATE;
    failureReason: string = mapper.FIELD_STR;
}

export interface PaginatedDocumentResponse extends PaginatedResponse {
    items: Array<DocumentResponse>;
}
