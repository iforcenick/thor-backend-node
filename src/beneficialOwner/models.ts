import {Mapper} from '../mapper';
import {mapper} from '../api';
import Joi = require('joi');
import * as regex from '../validation/regex';

export class BeneficialOwnerAddress extends Mapper {
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    stateProvinceRegion: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;

}

export class BeneficialOwnerBaseModel extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    @mapper.object(BeneficialOwnerAddress)
    address: BeneficialOwnerAddress = new BeneficialOwnerAddress();
    verificationStatus: string = mapper.FIELD_STR;
}

export class AddBeneficialOwnerResponse extends BeneficialOwnerBaseModel {
    id: string = mapper.FIELD_STR;
}

export class AddBeneficialOwnerRequest extends BeneficialOwnerBaseModel {
    dateOfBirth: string = mapper.FIELD_STR;
    ssn: string = mapper.FIELD_STR;
}

export const beneficialOwnerAddressSchema = Joi.object().keys({
    country: Joi.string().required(),
    stateProvinceRegion: Joi.string().required().uppercase().length(2),
    city: Joi.string().required().regex(regex.cityRegex),
    postalCode: Joi.string().required(),
    address1: Joi.string().max(50).regex(regex.poBox, regex.addressOptions).trim(),
    address2: Joi.string().max(50).regex(regex.poBox, regex.addressOptions).trim().allow('').strict(),
});

export const addBeneficialOwnerRequestSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dateOfBirth: Joi.string().regex(regex.dateRegex, {name: 'Format'}),
    ssn: Joi.string().required().invalid(['0000']).regex(regex.ssnRegex),
    address: beneficialOwnerAddressSchema.required()
});

export class EditBeneficialOwnerRequest extends AddBeneficialOwnerRequest {
    id: string = mapper.FIELD_STR;
}

export class EditBeneficialOwnerResponse extends BeneficialOwnerBaseModel {
    dateOfBirth: string = mapper.FIELD_STR;
    ssn: string = mapper.FIELD_STR;

}

export const editBeneficialOwnerRequestSchema = Joi.object().keys({
    id: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dateOfBirth: Joi.string().regex(regex.dateRegex, {name: 'Format'}),
    ssn: Joi.string().required().invalid(['0000']).regex(regex.ssnRegex),
    address: beneficialOwnerAddressSchema.required()
});

