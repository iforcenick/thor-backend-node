import {Mapper} from '../../mapper';
import {mapper} from '../../api';
import Joi = require('joi');

export class CreateTenantFundingSourceRequest extends Mapper {
    bankAccountType: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
}

export class TenantFundingSourceResponse extends Mapper {
    @mapper.fromName('fundingSourceVerificationStatus')
    verificationStatus: string = mapper.FIELD_STR;
}

export class TenantFundingSourceVerificationRequest extends Mapper {
    amount1: number = mapper.FIELD_NUM;
    amount2: number = mapper.FIELD_NUM;
}

export const tenantFundingSourceVerificationRequestSchema = Joi.object().keys({
    amount1: Joi.number().required(),
    amount2: Joi.number().required(),
});