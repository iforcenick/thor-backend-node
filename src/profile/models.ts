import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import Joi = require('joi');
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import * as tenant from '../tenant/models';
import * as user from '../user/models';
import * as role from '../user/role';
import * as _ from 'lodash';
import {FundingSource} from '../foundingSource/models';

export const enum Relations {
    user = 'user',
    tenant = 'tenant',
    roles = 'roles',
    fundingSources = 'fundingSources'
}

export class Profile extends db.Model {
    static tableName = db.Tables.profiles;
    firstName?: string = null;
    lastName?: string = null;
    phone?: string = null;
    email?: string = null;
    dwollaUri?: string = null;
    dwollaSourceUri?: string = null;
    dwollaStatus?: string = null;
    dwollaRouting?: string = null;
    dwollaAccount?: string = null;
    dwollaType?: string = null;
    tenantId?: string = null;
    country?: string = null;
    state?: string = null;
    city?: string = null;
    postalCode?: string = null;
    address1?: string = null;
    address2?: string = null;
    dateOfBirth?: string = null;
    userId?: string = null;
    roles?: Array<role.models.Role>;
    deletedAt?: Date = null;
    businessName?: string = null;
    doingBusinessAs?: string = null;
    businessType?: string = null;
    businessClassification?: string = null;
    ein?: string = null;
    website?: string = null;

    get externalStatus() {
        return this.dwollaStatus;
    }

    get externalType() {
        return this.dwollaType;
    }

    get accountRouting() {
        return this.dwollaRouting;
    }

    get accountNumber() {
        return this.dwollaAccount;
    }

    static get relationMappings() {
        return {
            [Relations.user]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: user.User,
                join: {
                    from: `${db.Tables.profiles}.userId`,
                    to: `${db.Tables.users}.id`,
                },
            },
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenant.Tenant,
                join: {
                    from: `${db.Tables.profiles}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
            [Relations.roles]: {
                relation: db.Model.ManyToManyRelation,
                modelClass: role.models.Role,
                join: {
                    from: `${db.Tables.profiles}.id`,
                    through: {
                        from: `${db.Tables.profilesRoles}.profileId`,
                        to: `${db.Tables.profilesRoles}.roleId`,
                    },
                    to: `${db.Tables.roles}.id`,
                },
            },
            [Relations.fundingSources]: {
                relation: db.Model.ManyToManyRelation,
                modelClass: FundingSource,
                join: {
                    from: `${db.Tables.profiles}.id`,
                    through: {
                        from: `${db.Tables.profilesFundingSources}.profileId`,
                        to: `${db.Tables.profilesFundingSources}.fundingSourceId`,
                    },
                    to: `${db.Tables.fundingSources}.id`,
                }
            },
        };
    }

    hasRole(role: role.models.Types) {
        for (const r of this.roles) {
            if (r.name == role) {
                return true;
            }
        }

        return false;
    }

    anonymise() {
        this.firstName = null;
        this.lastName = null;
        this.email = null;
        this.phone = null;
        this.country = null;
        this.state = null;
        this.city = null;
        this.postalCode = null;
        this.address1 = null;
        this.address2 = null;
        this.dateOfBirth = null;
        this.dwollaUri = null;
        this.dwollaSourceUri = null;
        this.dwollaStatus = null;
        this.deletedAt = new Date();
        this.businessName = null;
        this.doingBusinessAs = null;
        this.businessType = null;
        this.businessClassification = null;
        this.ein = null;
        this.website = null;
    }
}

export class ProfileBaseInfo extends Mapper {
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
    dateOfBirth: string = mapper.FIELD_STR;
}

export class ProfileResponse extends ProfileBaseInfo {
    id: string = mapper.FIELD_STR;
    userId: string = mapper.FIELD_STR;
    tenantId: string = mapper.FIELD_STR;
    externalStatus: string = mapper.FIELD_STR;
    externalType: string = mapper.FIELD_STR;
    @mapper.array(role.models.RoleResponse)
    roles: Array<role.models.RoleResponse> = mapper.FIELD_ARR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    businessName?: string = mapper.FIELD_STR;
    doingBusinessAs?: string = mapper.FIELD_STR;
    businessType?: string = mapper.FIELD_STR;
    businessClassification?: string = mapper.FIELD_STR;
    ein?: string = mapper.FIELD_STR;
    website?: string = mapper.FIELD_STR;
}

export class ProfileRequest extends ProfileBaseInfo {
    ssn: string = mapper.FIELD_STR;
}

export class BusinessVerifiedControllerAddress extends Mapper {
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    stateProvinceRegion: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
}

export class BusinessVerifiedController extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    title: string = mapper.FIELD_STR;
    dateOfBirth: string = mapper.FIELD_STR;
    ssn: string = mapper.FIELD_STR;
    @mapper.object(BusinessVerifiedControllerAddress)
    address: BusinessVerifiedControllerAddress = new BusinessVerifiedControllerAddress();
}

export class BusinessVerifiedRequest extends Mapper {
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
    dateOfBirth: string = mapper.FIELD_STR;
    ssn: string = mapper.FIELD_STR;
    businessName: string = mapper.FIELD_STR;
    doingBusinessAs: string = mapper.FIELD_STR;
    businessType: string = mapper.FIELD_STR;
    businessClassification: string = mapper.FIELD_STR;
    ein: string = mapper.FIELD_STR;
    website: string = mapper.FIELD_STR;
    @mapper.object(BusinessVerifiedController)
    controller: BusinessVerifiedController = new BusinessVerifiedController();
}

const poBox = /^ *((#\d+)|((box|bin)[-. \/\\]?\d+)|(.*p[ \.]? ?(o|0)[-. \/\\]? *-?((box|bin)|b|(#|num)?\d+))|(p(ost)? *(o(ff(ice)?)?)? *((box|bin)|b)? *\d+)|(p *-?\/?(o)? *-?box)|post office box|((box|bin)|b) *(number|num|#)? *\d+|(num|number|#) *\d+)/i;
const stateRegex = /^(?:(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]))$/;
const dateRegex = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/;
const phoneRegex = /^\d{10}$/;
const postalCodeRegex = /^[0-9]{5}(?:-[0-9]{4})?$/;

export const profileRequestSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().required().email(),
    dateOfBirth: Joi.string().required(),
    ssn: Joi.string().required().invalid(['0000']),
    country: Joi.string().required(),
    state: Joi.string().required().uppercase().length(2),
    city: Joi.string().required().regex(/[a-zA-Z]+/),
    postalCode: Joi.string().required(),
    address1: Joi.string().required().max(50),
    address2: Joi.string().allow('', null).max(50),
});

export const businessVerifiedControllerAddressSchema = Joi.object().keys({
    address1: Joi.string().required(),
    address2: Joi.string().allow('', null),
    city: Joi.string().required(),
    stateProvinceRegion: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
});

export const businessVerifiedControllerSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    title: Joi.string().required(),
    dateOfBirth: Joi.string().required(),
    ssn: Joi.string().required(),
    address: businessVerifiedControllerAddressSchema.required(),
});

export const businessVerifiedRequestSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().required().email(),
    dateOfBirth: Joi.string().required(),
    ssn: Joi.string().required().invalid(['0000']),
    country: Joi.string().required(),
    state: Joi.string().required().uppercase().length(2),
    city: Joi.string().required().regex(/[a-zA-Z]+/),
    postalCode: Joi.string().required(),
    address1: Joi.string().required().max(50),
    address2: Joi.string().allow('', null).max(50),
    businessName: Joi.string().required(),
    doingBusinessAs: Joi.string().allow('', null),
    businessType: Joi.string().required(),
    businessClassification: Joi.string().required(),
    ein: Joi.string().allow('', null),
    website: Joi.string().allow('', null),
    controller: businessVerifiedControllerSchema,
});

export const profilePatchSchema = Joi.object().keys({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phone: Joi.string().regex(phoneRegex),
    email: Joi.string().email(),
    dateOfBirth: Joi.string().regex(dateRegex, {name: 'Format'}),
    ssn: Joi.forbidden(),
    country: Joi.string(),
    state: Joi.string().regex(stateRegex),
    city: Joi.string().regex(/[a-zA-Z]+/),
    postalCode: Joi.string().regex(postalCodeRegex),
    address1: Joi.string().max(50).regex(poBox, {invert: true, name: 'PO box'}).trim(),
    address2: Joi.string().max(50).regex(poBox, {invert: true, name: 'PO box'}).trim().allow('').strict(),
});
