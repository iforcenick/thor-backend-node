import * as mapper from '../mapper';
import * as profile from '../profile/models';
import {Mapper} from '../mapper';
import Joi = require('joi');

export class ContractorBaseModel extends Mapper {
}

export class ContractorRequest extends ContractorBaseModel {
    password: string = mapper.FIELD_STR;
    @mapper.object(profile.ProfileRequest)
    profile: profile.ProfileRequest = new profile.ProfileRequest();
    invitationToken: string = mapper.FIELD_STR;
}


export class ContractorResponse extends ContractorBaseModel {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    lastActivity: Date = mapper.FIELD_DATE;
    @mapper.object(profile.ProfileResponse)
    tenantProfile: profile.ProfileResponse = new profile.ProfileResponse();
    token: string = mapper.FIELD_STR;
}

export const contractorRequestSchema = Joi.object().keys({
    password: Joi.string().required(),
    profile: profile.profileRequestSchema.required(),
    invitationToken: Joi.string().required(),
});

export interface PasswordRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const passwordRequestSchema = Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmPassword: Joi.string().required(),
});
