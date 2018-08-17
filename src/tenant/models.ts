import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import Joi = require('joi');
import {Profile} from '../profile/models';
const guid = require('objection-guid')();

export class Tenant extends guid(db.Model) {
    static tableName = 'tenants';
    name?: string;
    dwollaUri?: string;
    static relationMappings = {
        profiles: {
            relation: Tenant.HasManyRelation,
            modelClass: Profile,
            join: {
                from: 'tenants.id',
                to: 'profiles.tenantId'
            }
        }
    };
}

export class TenantBaseInfo extends Mapper {
    name: string = mapper.FIELD_STR;
    dwollaUri: string = mapper.FIELD_STR;
}

export class TenantResponse extends TenantBaseInfo {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

export class TenantRequest extends TenantBaseInfo {
}

export interface PaginatedTenantReponse extends PaginatedResponse {
    items: Array<TenantResponse>;
}

export const tenantRequestSchema = Joi.object().keys({
    name: Joi.string().required(),
    dwollaUri: Joi.string(),
});
