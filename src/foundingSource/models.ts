import * as db from '../db';
import * as tenant from '../tenant/models';
import * as mapper from '../mapper';
import {Mapper} from '../mapper';
import Joi = require('joi');


export const enum VerificationStatuses {
    initiated = 'initiated',
    completed = 'completed'
}

export const enum Relations {
    tenant = 'tenant',
    profile = 'profile'
}

export class FundingSource extends db.Model {
    static tableName = db.Tables.fundingSources;
    type?: string = null;
    dwollaUri?: string = null;
    tenantId?: string = null;
    profileId?: string = null;
    isDefault?: boolean = null;
    verificationStatus?: string = null;

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


export class FundingSourceResponse {
    id: string = mapper.FIELD_STR;
    type: string = mapper.FIELD_STR;
    externalUri: string = mapper.FIELD_STR;
    tenantId: string = mapper.FIELD_STR;
    profileId: string = mapper.FIELD_STR;
    isDefault: boolean = mapper.FIELD_BOOLEAN;
    verificationStatus: string = mapper.FIELD_STR;
}

export class UserFundingSourceVerificationRequest extends Mapper {
    amount1: number = mapper.FIELD_NUM;
    amount2: number = mapper.FIELD_NUM;
}

export class FundingSourceIavToken extends Mapper {
    token: string = mapper.FIELD_STR;
}

export class FundingSourceIavRequest extends Mapper {
    uri: string = mapper.FIELD_STR;
}

export const fundingSourceIavRequestSchema = Joi.object().keys({
    uri: Joi.string().required(),
});

export const contractorFundingSourceVerificationRequestSchema = Joi.object().keys({
    amount1: Joi.number().required(),
    amount2: Joi.number().required(),
});

