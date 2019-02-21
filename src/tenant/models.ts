import Joi = require('joi');
import {mapper} from '../api';
import * as db from '../db';
import {Mapper} from '../mapper';
import {Profile} from '../profile/models';
import * as payments from '../payment';

export const enum Relations {
    profiles = 'profiles',
}

export const enum Statuses {
    company = 'company', // tenant is missing company information
    bank = 'bank', // tenant needs to add their bank info
    active = 'active', // tenant account is ready to manage contractors
}

export class Tenant extends db.Model {
    static tableName = db.Tables.tenants;
    name?: string = null;
    paymentsUri?: string = null;
    paymentsStatus?: string = null;
    paymentsType?: string = null;
    firstName?: string = null;
    lastName?: string = null;
    phone?: string = null;
    email?: string = null;
    country?: string = null;
    state?: string = null;
    city?: string = null;
    postalCode?: string = null;
    address1?: string = null;
    address2?: string = null;
    businessName?: string = null;
    doingBusinessAs?: string = null;
    businessType?: string = null;
    businessClassification?: string = null;
    website?: string = null;
    fundingSourceUri?: string = null;
    fundingSourceName?: string = null;
    fundingSourceStatus?: string = null;
    settings: any = null;
    status?: string = null;
    ein?: string = null;

    static get relationMappings() {
        return {
            [Relations.profiles]: {
                relation: db.Model.HasManyRelation,
                modelClass: Profile,
                join: {
                    from: `${db.Tables.tenants}.id`,
                    to: `${db.Tables.profiles}.tenantId`,
                },
            },
        };
    }

    get company() {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            address1: this.address1,
            address2: this.address2,
            city: this.city,
            state: this.state,
            country: this.country,
            postalCode: this.postalCode,
            businessName: this.businessName,
            doingBusinessAs: this.doingBusinessAs,
            businessType: this.businessType,
            businessClassification: this.businessClassification,
            ein: this.ein,
            website: this.website,
            phone: this.phone,
            status: this.paymentsStatus,
        };
    }
}

export class TenantBaseInfo extends Mapper {
    name: string = mapper.FIELD_STR;
}

export class TenantCompanyResponse extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    phone: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
    state: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    businessName?: string = mapper.FIELD_STR;
    doingBusinessAs?: string = mapper.FIELD_STR;
    businessType?: string = mapper.FIELD_STR;
    businessClassification?: string = mapper.FIELD_STR;
    website?: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
}

export class TenantResponse extends TenantBaseInfo {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    status: string = mapper.FIELD_STR;
    settings: object = mapper.object;
}

export class TenantOwnerAddressResponse extends Mapper {
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    stateProvinceRegion: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
}

export class TenantOwnerResponse extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    title: string = mapper.FIELD_STR;
    @mapper.object(TenantOwnerAddressResponse)
    address: TenantOwnerAddressResponse = new TenantOwnerAddressResponse();
}

export class TenantControllerAddress extends Mapper {
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    stateProvinceRegion: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
}

export class TenantController extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    title: string = mapper.FIELD_STR;
    dateOfBirth: string = mapper.FIELD_STR;
    ssn: string = mapper.FIELD_STR;
    @mapper.object(TenantControllerAddress)
    address: TenantControllerAddress = new TenantControllerAddress();
}

export class TenantCompanyRequest extends Mapper {
    // company details
    businessName: string = mapper.FIELD_STR;
    doingBusinessAs: string = mapper.FIELD_STR;
    businessType: string = mapper.FIELD_STR;
    businessClassification: string = mapper.FIELD_STR;
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    state: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    phone: string = mapper.FIELD_STR;
    ein: string = mapper.FIELD_STR;
    website: string = mapper.FIELD_STR;
    // admin or owner
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
    dateOfBirth: string = mapper.FIELD_STR;
    ssn: string = mapper.FIELD_STR;
    // controller
    @mapper.object(TenantController)
    controller: TenantController = new TenantController();
}

export class TenantCompanyPatchRequest extends Mapper {
    phone: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
    state: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    doingBusinessAs: string = mapper.FIELD_STR;
    website: string = mapper.FIELD_STR;
}

export class TenantCompanyRetryRequest extends TenantCompanyRequest {}

export class TenantRequest extends TenantBaseInfo {}

export class TenantCompanyDocument extends Mapper {
    type: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    created: Date = mapper.FIELD_DATE;
    failureReason: string = mapper.FIELD_STR;
}

export const tenantRequestSchema = Joi.object().keys({
    name: Joi.string().required(),
    paymentsUri: Joi.string(),
});

export const tenantControllerPassportSchema = Joi.object().keys({
    number: Joi.string().required(),
    country: Joi.string().length(2).required(),
});

export const tenantControllerAddressSchema = Joi.object().keys({
    address1: Joi.string().required(),
    address2: Joi.string().allow('', null),
    address3: Joi.string().allow('', null),
    city: Joi.string().required(),
    stateProvinceRegion: Joi.string().required().length(2),
    postalCode: Joi.string().allow('', null), // optional,
    country: Joi.string().required().length(2).default('US'),
});

export const tenantControllerSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    title: Joi.string().required(),
    dateOfBirth: Joi.string().required(),
    ssn: Joi.string().required().invalid(['0000']),
    address: tenantControllerAddressSchema.required(),
    // passport: tenantControllerPassportSchema,
});

export const tenantCompanyRequestSchema = Joi.object().keys({
    // company profile
    businessName: Joi.string().required(),
    doingBusinessAs: Joi.string().allow('', null), // optional
    businessType: Joi.string().required(),
    businessClassification: Joi.string().required(),
    website: Joi.string().allow('', null), // optional
    ein: Joi.string().when('businessType', {
        is: Joi.equal(payments.customers.BUSINESS_TYPE.Sole),
        then: Joi.allow('', null), // optional for sole
        otherwise: Joi.required(),
    }),
    address1: Joi.string().required().max(50),
    address2: Joi.string().allow('', null).max(50), // optional
    city: Joi.string().required().regex(/[a-zA-Z]+/),
    state: Joi.string().required().uppercase().length(2),
    postalCode: Joi.string().required(),
    phone: Joi.string().allow('', null), // optional
    // business owner or admin
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required().email(),
    dateOfBirth: Joi.string().when('businessType', {
        is: Joi.equal(payments.customers.BUSINESS_TYPE.Sole),
        then: Joi.allow('', null), // optional for sole
        otherwise: Joi.required(),
    }),
    ssn: Joi.string().invalid(['0000']).when('businessType', {
        is: Joi.equal(payments.customers.BUSINESS_TYPE.Sole),
        then: Joi.required(), // required for sole
        otherwise: Joi.allow('', null),
    }),
    // controller
    controller: tenantControllerSchema.when('businessType', {
        is: Joi.equal(payments.customers.BUSINESS_TYPE.Sole),
        then: Joi.forbidden(),
        otherwise: Joi.required(),
    }),
});

export const tenantCompanyPatchRequestSchema = Joi.object().keys({
    phone: Joi.string(), // optional
    email: Joi.string().required().email(),
    address1: Joi.string().required().max(50),
    address2: Joi.string().allow('', null).max(50),
    city: Joi.string().required().regex(/[a-zA-Z]+/),
    state: Joi.string().required().uppercase().length(2),
    country: Joi.string().length(2).default('US'), // optional
    postalCode: Joi.string().required(),
    doingBusinessAs: Joi.string().allow('', null), // optional
    website: Joi.string().allow('', null), // optional
});

export const tenantCompanyRetryRequestSchema = tenantCompanyRequestSchema;

export class BusinessClassificationItem extends Mapper {
    id: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
}

export class BusinessClassification extends Mapper {
    @mapper.array(BusinessClassificationItem)
    @mapper.fromName('industry-classifications')
    industryClassifications: Array<BusinessClassificationItem> = mapper.FIELD_ARR;
}

export class BusinessClassificationsCategory extends Mapper {
    @mapper.object(BusinessClassification)
    @mapper.fromName('_embedded')
    category: BusinessClassification = new BusinessClassification();

    id: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
}

export class BusinessClassificationsResponse extends Mapper {
    @mapper.array(BusinessClassificationsCategory)
    @mapper.fromName('business-classifications')
    businessClassifications: Array<BusinessClassificationsCategory> = mapper.FIELD_ARR;
}
