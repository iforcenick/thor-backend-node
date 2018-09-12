import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import Joi = require('joi');
import {Profile} from '../profile/models';

export const enum Relations {
    profiles = 'profiles',
}

export class Tenant extends db.Model {
    static tableName = db.Tables.tenants;
    name?: string;
    dwollaUri?: string;

    static get relationMappings() {
        return {
            [Relations.profiles]: {
                relation: db.Model.HasManyRelation,
                modelClass: Profile,
                join: {
                    from: `${db.Tables.tenants}.id`,
                    to: `${db.Tables.profiles}.tenantId`
                }
            }
        };
    }
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

export interface PaginatedTenantResponse extends PaginatedResponse {
    items: Array<TenantResponse>;
}

export const tenantRequestSchema = Joi.object().keys({
    name: Joi.string().required(),
    dwollaUri: Joi.string(),
});

export class TenantStatsPeriod extends Mapper {
    count: string = mapper.FIELD_STR;
    percent: string = mapper.FIELD_STR;
}

export class TenantStatsResponse extends Mapper {
    total: string = mapper.FIELD_STR;
    active: TenantStatsPeriod = new TenantStatsPeriod();
    resting: TenantStatsPeriod = new TenantStatsPeriod();
    inactive: TenantStatsPeriod = new TenantStatsPeriod();
}
