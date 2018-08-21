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
    tenantId?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    street?: string;
    userId?:string;
    roles?: Array<role.models.Role>;

    hasRole(role: role.models.Types) {
        for (const r of this.roles) {
            if (r.name == role) {
                return true;
            }
        }

        return false;
    }

    static get relationMappings() {
        return {
            [Relations.user]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: user.User,
                join: {
                    from: `${db.Tables.profiles}.userId`,
                    to: `${db.Tables.users}.id`
                }
            },
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenant.Tenant,
                join: {
                    from: `${db.Tables.profiles}.tenantId`,
                    to: `${db.Tables.tenants}.id`
                }
            },
            [Relations.roles]: {
                relation: db.Model.ManyToManyRelation,
                modelClass: role.models.Role,
                join: {
                    from: `${db.Tables.profiles}.id`,
                    through: {
                        from: `${db.Tables.profilesRoles}.profileId`,
                        to: `${db.Tables.profilesRoles}.roleId`
                    },
                    to: `${db.Tables.roles}.id`
                }
            },
        };
    }
}

export class ProfileBaseInfo extends Mapper {
    name: string = mapper.FIELD_STR;
    dwollaUri: string = mapper.FIELD_STR;
    dwollaSourceUri: string = mapper.FIELD_STR;
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    phone: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
    tenantId: string = mapper.FIELD_STR;
    country: string = mapper.FIELD_STR;
    state: string = mapper.FIELD_STR;
    city: string = mapper.FIELD_STR;
    postalCode: string = mapper.FIELD_STR;
    street: string = mapper.FIELD_STR;
}

export class ProfileResponse extends ProfileBaseInfo {
    id: string = mapper.FIELD_STR;
    userId: string = mapper.FIELD_STR;
    tenantId: string = mapper.FIELD_STR;
    [Relations.roles]: Array<role.models.RoleResponse> = mapper.FIELD_ARR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

mapper.registerRelation(ProfileResponse, [Relations.roles], new mapper.ArrayRelation(role.models.RoleResponse));

export class ProfileRequest extends ProfileBaseInfo {
}

export interface PaginatedProfileReponse extends PaginatedResponse {
    items: Array<ProfileResponse>;
}

export const profileRequestSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dwollaUri: Joi.string(),
});
