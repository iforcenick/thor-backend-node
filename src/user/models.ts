import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import * as role from './role';
import Joi = require('joi');
const guid = require('objection-guid')();

export class User extends guid(db.Model) {
    static tableName = 'users';
    phone?: string;
    name?: string;
    email?: string;
    password?: string;

    static relationMappings = {
        roles: {
            relation: User.ManyToManyRelation,
            modelClass: role.models.Role,
            join: {
                from: 'users.id',
                through: {
                    from: 'users_roles.userId',
                    to: 'users_roles.roleId'
                },
                to: 'roles.id'
            }
        }
    };
}

export class UserBaseInfo extends Mapper {
    phone: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
}

export class UserResponse extends UserBaseInfo {
    id: number = mapper.FIELD_NUM;
    roles: Array<role.models.RoleResponse> = mapper.FIELD_ARR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

mapper.registerRelation(UserResponse, 'roles', new mapper.ArrayRelation(role.models.RoleResponse));

export class UserRequest extends UserBaseInfo {
    password: string = mapper.FIELD_STR;
}

export interface PaginatedUserReponse extends PaginatedResponse {
    items: Array<UserResponse>;
}

export const userRequestSchema = Joi.object().keys({
    phone: Joi.string().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
});
