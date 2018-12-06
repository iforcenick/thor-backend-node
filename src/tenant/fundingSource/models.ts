import {Mapper} from '../../mapper';
import {mapper} from '../../api';
import Joi = require('joi');

export class CreateTenantFundingSourceRequest extends Mapper {
    account: string = mapper.FIELD_STR;
    routing: string = mapper.FIELD_STR;
    bankAccountType: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
}

export class TenantFundingSourceResponse extends Mapper {
    @mapper.fromName('fundingSourceName')
    name: string = mapper.FIELD_STR;
    @mapper.fromName('fundingSourceVerificationStatus')
    verificationStatus: string = mapper.FIELD_STR;
}

export class TenantFundingSourceVerificationRequest extends Mapper {
    amount1: number = mapper.FIELD_NUM;
    amount2: number = mapper.FIELD_NUM;
}

export const createTenantFundingSourceRequestSchema = Joi.object().keys({
    account: Joi.string().required(),
    routing: Joi.string().required(),
    bankAccountType: Joi.string().allow('', null),
    name: Joi.string().required()
});

export const tenantFundingSourceVerificationRequestSchema = Joi.object().keys({
    amount1: Joi.number().required(),
    amount2: Joi.number().required(),
});

export class FundingSourceIavRequest extends Mapper {
    uri: string = mapper.FIELD_STR;
}