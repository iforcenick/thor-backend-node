import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import Joi = require('joi');
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import * as tenant from '../tenant/models';
import {User} from '../user/models';

export class Profile extends db.Model {
    static tableName = 'profiles';
    name?: string;
    phone?: string;
    email?: string;
    dwollaUri?: string;
    dwollaSourceUri?: string;
    static relationMappings = {
        user: {
            relation: db.Model.BelongsToOneRelation,
            modelClass: User,
            join: {
                from: 'profiles.userId',
                to: 'users.id'
            }
        },
        tenant: {
            relation: db.Model.BelongsToOneRelation,
            modelClass: tenant.Tenant,
            join: {
                from: 'profiles.tenantId',
                to: 'tenants.id'
            }
        }
    };
}

export class ProfileBaseInfo extends Mapper {
    name: string = mapper.FIELD_STR;
    dwollaUri: string = mapper.FIELD_STR;
    dwollaSourceUri: string = mapper.FIELD_STR;
}

export class ProfileResponse extends ProfileBaseInfo {
    id: string = mapper.FIELD_STR;
    userId: string = mapper.FIELD_STR;
    tenantId: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

export class ProfileRequest extends ProfileBaseInfo {
}

export interface PaginatedProfileReponse extends PaginatedResponse {
    items: Array<ProfileResponse>;
}

export const profileRequestSchema = Joi.object().keys({
    name: Joi.string().required(),
    dwollaUri: Joi.string(),
});
