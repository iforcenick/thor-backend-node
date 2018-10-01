import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import Joi = require('joi');
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import * as tenant from '../tenant/models';
import * as user from '../user/models';
import * as role from '../user/role';

export const enum Relations {
    user = 'user',
    tenant = 'tenant',
    roles = 'roles',
}

export class Profile extends db.Model {
    static tableName = db.Tables.profiles;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    dwollaUri?: string;
    dwollaSourceUri?: string;
    dwollaStatus?: string;
    dwollaRouting?: string;
    dwollaAccount?: string;
    tenantId?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    address1?: string;
    address2?: string;
    dateOfBirth?: string;
    userId?: string;
    roles?: Array<role.models.Role>;
    deletedAt?: Date;

    get externalStatus() {
        return this.dwollaStatus;
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
    accountRouting: string = mapper.FIELD_STR;
    accountNumber: string = mapper.FIELD_STR;
    roles: Array<role.models.RoleResponse> = mapper.FIELD_ARR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

mapper.registerRelation(ProfileResponse, Relations.roles, new mapper.ArrayRelation(role.models.RoleResponse));

export class ProfileRequest extends ProfileBaseInfo {
    ssn: string = mapper.FIELD_STR;
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
    address2: Joi.string().max(50),
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
