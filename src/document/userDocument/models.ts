import {PaginatedResponse, mapper} from '../../api';
import * as db from '../../db';
import {Mapper} from '../../mapper';
import {Tenant} from '../../tenant/models';
import {User} from '../../user/models';
import {Document} from '../models';

export const enum Relations {
    user = 'user',
    tenant = 'tenant',
    document = 'document',
}

export const enum Statuses {
    pending = 'pending',
    approved = 'approved',
    rejected = 'rejected',
}

export class UserDocument extends db.Model {
    static tableName = db.Tables.usersDocuments;
    userId?: string = null;
    tenantId?: string = null;
    fileName?: string = null;
    status?: string = null;
    documentId?: string = null;
    deletedAt?: Date = null;

    static get relationMappings() {
        return {
            [Relations.user]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: `${db.Tables.usersDocuments}.userId`,
                    to: `${db.Tables.users}.id`,
                },
            },
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: Tenant,
                join: {
                    from: `${db.Tables.usersDocuments}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
            [Relations.document]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: Document,
                join: {
                    from: `${db.Tables.usersDocuments}.documentId`,
                    to: `${db.Tables.documents}.id`,
                },
            },
        };
    }

    static filter(query, userId?: string) {
        if (userId) {
            query.where(`${db.Tables.usersDocuments}.userId`, userId);
        }
    }
}

export class UserDocumentBaseModel extends Mapper {}

export class UserDocumentResponse extends UserDocumentBaseModel {
    id: string = mapper.FIELD_STR;
    documentId: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    isRequired: boolean = mapper.FIELD_BOOLEAN;
    createdAt: Date = mapper.FIELD_DATE;
}

export interface PaginatedUserDocumentResponse extends PaginatedResponse {
    items: Array<UserDocumentResponse>;
}
