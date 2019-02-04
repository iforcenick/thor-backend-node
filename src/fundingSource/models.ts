import * as db from '../db';
import {Profile} from '../profile/models';
import * as mapper from '../mapper';
import {Mapper} from '../mapper';
import Joi = require('joi');

export const enum Statuses {
    initiated = 'initiated',
    verified = 'verified'
}

export const enum Relations {
    profile = 'profile'
}

export class FundingSource extends db.Model {
    static tableName = db.Tables.fundingSources;
    type?: string = null;
    name?: string = null;
    paymentsUri?: string = null;
    profileId?: string = null;
    isDefault?: boolean = null;
    status?: string = null;

    static get relationMappings() {
        return {
            [Relations.profile]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: Profile,
                join: {
                    from: `${db.Tables.fundingSources}.profileId`,
                    to: `${db.Tables.profiles}.id`,
                },
            },
        };
    }
}

export class FundingSourceBaseInfo extends Mapper {
    name: string = mapper.FIELD_STR;
}

export class FundingSourceRequest extends FundingSourceBaseInfo {
}

export class FundingSourceResponse extends FundingSourceBaseInfo {
    id: string = mapper.FIELD_STR;
    type: string = mapper.FIELD_STR;
    paymentsUri: string = mapper.FIELD_STR;
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

export const fundingSourceRequestSchema = Joi.object().keys({
    routing: Joi.string().required(),
    account: Joi.string().required(),
    name: Joi.string().allow(null, '').default('default'),
});

export const contractorFundingSourceVerificationRequestSchema = Joi.object().keys({
    amount1: Joi.number().required(),
    amount2: Joi.number().required(),
});
