import Joi = require('joi');
import {Mapper} from '../mapper';
import * as mapper from '../mapper';
import * as profile from '../profile/models';

export class ContractorBaseModel extends Mapper {
}

export class ContractorRequest extends ContractorBaseModel {
    @mapper.object(profile.ProfileRequest)
    profile: profile.ProfileRequest = new profile.ProfileRequest();
}

export class ContractorResponse extends ContractorBaseModel {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    lastActivity: Date = mapper.FIELD_DATE;
    @mapper.object(profile.ProfileResponse)
    tenantProfile: profile.ProfileResponse = new profile.ProfileResponse();
}

export const contractorRequestSchema = Joi.object().keys({
    profile: profile.profileRequestSchema.required(),
});
