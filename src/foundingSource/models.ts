import * as db from '../db';
import * as tenant from '../tenant/models';
import * as profile from '../profile/models';
import {Mapper} from '../mapper';
import * as mapper from '../mapper';
import Joi = require('joi');


export const enum Relations {
    tenant = 'tenant',
    profile = 'profile'
}

export class FundingSource extends db.Model {
    static tableName = db.Tables.fundingSources;
    routing?: string = null;
    account?: string = null;
    name?: string = null;
    type?: string = null;
    dwollaUri?: string = null;
    tenantId?: string = null;
    profileId?: string = null;
    isDefault?: boolean = null;

    get externalUri() {
        return this.dwollaUri;
    }

    static get relationMappings() {
        return {
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenant.Tenant,
                join: {
                    from: `${db.Tables.fundingSources}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
        };
    }
}


export class FundingSourceBaseInfo extends Mapper {
    routing: string = mapper.FIELD_STR;
    account: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
}
export class FundingSourceRequest extends FundingSourceBaseInfo {
}

export class FundingSourceResponse extends FundingSourceBaseInfo {
    id: string = mapper.FIELD_STR;
    type: string = mapper.FIELD_STR;
    externalUri: string = mapper.FIELD_STR;
    tenantId: string = mapper.FIELD_STR;
    profileId: string = mapper.FIELD_STR;
    isDefault: boolean = mapper.FIELD_BOOLEAN;
}

export const fundingSourceRequestSchema = Joi.object().keys({
    routing: Joi.string().required(),
    account: Joi.string().required(),
    name: Joi.string().allow(null, '').default('default'),
});