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
    street?: string;
    dateOfBirth?: string;
    userId?: string;
    roles?: Array<role.models.Role>;

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

export interface PaginatedProfileReponse extends PaginatedResponse {
    items: Array<ProfileResponse>;
}

export const profileRequestSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().required(),
    dateOfBirth: Joi.string().required(),
    ssn: Joi.string().required(),
    country: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    postalCode: Joi.string().required(),
    address1: Joi.string().required(),
    address2: Joi.string(),
});

export const profilePatchSchema = profileRequestSchema;
