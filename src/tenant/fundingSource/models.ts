import {Mapper} from '../../mapper';
import {mapper} from '../../api';
import Joi = require('joi');

export class CreateTenantFundingSourceRequest extends Mapper {
    account: string = mapper.FIELD_STR;
    routing: string = mapper.FIELD_STR;
    bankAccountType: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
}

export const createTenantFundingSourceRequestSchema = Joi.object().keys({
    account:  Joi.string().required(),
    routing:  Joi.string().required(),
    bankAccountType: Joi.string().allow('', null),
    name:  Joi.string().required()
});


export class FundingSourceBase extends Mapper {
    @mapper.fromName('fundingSourceRouting')
    routing: string = mapper.FIELD_STR;
    @mapper.fromName('fundingSourceAccount')
    account: string = mapper.FIELD_STR;
    @mapper.fromName('fundingSourceName')
    name: string = mapper.FIELD_STR;
}