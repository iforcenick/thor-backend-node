import * as mapper from '../mapper';
import * as profile from '../profile/models';
import {TransactionResponse} from '../transaction/models';
import {Mapper} from '../mapper';
import Joi = require('joi');

export class ContractorBaseModel extends Mapper {
}

export class ContractorRequest extends ContractorBaseModel {
    password: string = mapper.FIELD_STR;
    profile: profile.ProfileRequest = new profile.ProfileRequest();
    tenantId: string = mapper.FIELD_STR;
}


export class ContractorResponse extends ContractorBaseModel {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    lastTransaction: Date = mapper.FIELD_DATE;
    lastActivity: Date = mapper.FIELD_DATE;
    rank: number = mapper.FIELD_NUM;
    prev: number = mapper.FIELD_NUM;
    tenantProfile: profile.ProfileResponse = new profile.ProfileResponse();
    transactions: Array<TransactionResponse> = mapper.FIELD_ARR;
}

export const contractorRequestSchema = Joi.object().keys({
    profile: profile.profileRequestSchema.required(),
});
