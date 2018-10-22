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
    name?: string = null;
    dwollaUri?: string = null;

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
}

export class TenantCompany extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    phone: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
    state: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    businessName?: string = mapper.FIELD_STR;
    doingBusinessAs?: string = mapper.FIELD_STR;
    businessType?: string = mapper.FIELD_STR;
    businessClassification?: string = mapper.FIELD_STR;
    ein?: string = mapper.FIELD_STR;
    website?: string = mapper.FIELD_STR;
}

export class TenantResponse extends TenantBaseInfo {
    id: string = mapper.FIELD_STR;
    @mapper.object(TenantCompany)
    company: TenantCompany = new TenantCompany();
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

export class TenantOwnerAddressResponse extends Mapper {
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    stateProvinceRegion: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
}

export class TenantOwnerResponse extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    title: string = mapper.FIELD_STR;
    @mapper.object(TenantOwnerAddressResponse)
    address: TenantOwnerAddressResponse = new TenantOwnerAddressResponse();
}

export class TenantRequest extends TenantBaseInfo {
}

export const tenantRequestSchema = Joi.object().keys({
    name: Joi.string().required(),
    dwollaUri: Joi.string(),
});

export class TenantStatsPeriod extends Mapper {
    count: string = mapper.FIELD_STR;
    percent: string = mapper.FIELD_STR;
}
