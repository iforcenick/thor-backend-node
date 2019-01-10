import Joi = require('joi');
import * as db from '../../db';
import {PaginatedResponse, mapper} from '../../api';
import * as tenant from '../../tenant/models';
import * as user from '../../user/models';
import {Mapper} from '../../mapper';

export const enum Relations {
    user = 'users',
    tenant = 'tenants',
}

export class UserDocument extends db.Model {
    static tableName = db.Tables.userDocuments;
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
                    from: `${db.Tables.userDocuments}.userId`,
                    to: `${db.Tables.users}.id`,
                },
            },
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenant.Tenant,
                join: {
                    from: `${db.Tables.userDocuments}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
        };
    }

    static filter(query, userId?: string, type?: string) {
        if (userId) {
            query.where(`${db.Tables.userDocuments}.userId`, userId);
        }

        if (type) {
            query.where(`${db.Tables.userDocuments}.type`, type);
        }
    }
}

export class UserDocumentBaseModel extends Mapper {}

export class UserDocumentRequest extends UserDocumentBaseModel {
    type: string = mapper.FIELD_STR;
}

export class UserDocumentResponse extends UserDocumentBaseModel {
    id: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
    type: string = mapper.FIELD_STR;
    createdOn: Date = mapper.FIELD_DATE;
}

export interface PaginatedUserDocumentResponse extends PaginatedResponse {
    items: Array<UserDocumentResponse>;
}
