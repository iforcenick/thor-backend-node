import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import * as profile from '../profile/models';
import * as role from './role';
import Joi = require('joi');

export const enum Relations {
    roles = 'roles',
    profile = 'profiles',
}

export class User extends db.Model {
    static tableName = db.Tables.users;
    phone?: string;
    name?: string;
    email?: string;
    password?: string;
    profiles?: Array<profile.Profile>;

    get profile(): profile.Profile {
        return this.profiles[0];
    }

    hasRole(role: role.models.Types) {
        return this.profile.hasRole(role);
    }

    static relationMappings = {
        [Relations.profile]: {
            relation: db.Model.HasManyRelation,
            modelClass: profile.Profile,
            join: {
                from: `${db.Tables.users}.id`,
                to: `${db.Tables.profiles}.userId`
            }
        },
    };
}

export class UserBaseInfo extends Mapper {
    phone: string = mapper.FIELD_STR;
    name: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
}

export class UserResponse extends UserBaseInfo {
    id: number = mapper.FIELD_NUM;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    profile: profile.ProfileResponse = new profile.ProfileResponse();
}

mapper.registerRelation(UserResponse, 'profile', new mapper.Relation(profile.ProfileResponse));

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
