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
import * as regex from '../validation/regex';
import * as dwolla from '../dwolla';
import moment = require('moment');

export const enum Relations {
    user = 'user',
    tenant = 'tenant',
    roles = 'roles',
    fundingSources = 'fundingSources'
}

export const enum Statuses {
    invited = 'invited',    // tenant has invited the contractor to create/link an account
    tax = 'tax',            // contractor's profile is missing tax information
    payment = 'payment',    // contractor's payment status requires review
    document = 'document',  // contractor needs to upload additional documentation
    bank = 'bank',          // contractor needs to add their bank info
    active = 'active',      // contractor account is ready to be paid
    job = 'job',            // contractor must complete additional onboarding steps for a job
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
    externalId?: string = null;
    status?: string = null;

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
        this.externalId = null;
    }

    dwollaUpdateAvailable() {
        return [dwolla.customer.CUSTOMER_STATUS.Verified, dwolla.customer.CUSTOMER_STATUS.Unverified].includes(this.dwollaStatus);
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
    dateOfBirth: Date = mapper.FIELD_DATE;
    externalId: string = mapper.FIELD_STR;
}

export class ProfileResponse extends ProfileBaseInfo {
    id: string = mapper.FIELD_STR;
    userId: string = mapper.FIELD_STR;
    tenantId: string = mapper.FIELD_STR;
    externalStatus: string = mapper.FIELD_STR;
    externalType: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    @mapper.array(role.models.RoleResponse)
    roles: Array<role.models.RoleResponse> = mapper.FIELD_ARR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

export class ProfileRequest extends ProfileBaseInfo {
    ssn: string = mapper.FIELD_STR;
}

export class ProfilePatchRequest extends ProfileBaseInfo {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    phone: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
    state: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    address1: string = mapper.FIELD_STR;
    address2: string = mapper.FIELD_STR;
}

export const profileRequestSchema = Joi.object().keys({
    externalId: Joi.string().allow('', null),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().allow('', null).regex(regex.phoneRegex),
    email: Joi.string().required().email(),
    dateOfBirth:  Joi.date().max(moment(Date.now()).subtract(18, 'years')
        .calendar()).error(message => {
            return 'You must be at least 18 years old';
    }).required(),
    ssn: Joi.string().required(),
    country: Joi.string().required(),
    state: Joi.string().required().uppercase().length(2),
    city: Joi.string().required().regex(/[a-zA-Z]+/),
    postalCode: Joi.string().required(),
    address1: Joi.string().required().max(50),
    address2: Joi.string().allow('', null).max(50),
});

export const profilePatchSchema = Joi.object().keys({
    externalId: Joi.string().allow('', null),
    firstName: Joi.string(),
    lastName: Joi.string(),
    phone: Joi.string().regex(regex.phoneRegex),
    country: Joi.string(),
    state: Joi.string().uppercase().length(2),
    city: Joi.string().regex(/[a-zA-Z]+/),
    postalCode: Joi.string(),
    address1: Joi.string().max(50),
    address2: Joi.string().allow('', null).max(50),
    dateOfBirth:  Joi.date().max(moment(Date.now()).subtract(18, 'years')
        .calendar()).error(message => {
        return 'You must be at least 18 years old';
    }).allow(null),
});
