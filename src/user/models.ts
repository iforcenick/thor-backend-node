import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation, Pojo} from 'objection'; // for ManyToManyRelation compilation
import * as profile from '../profile/models';
import * as role from './role';
import Joi = require('joi');
import _ from 'lodash';

export const enum Relations {
    roles = 'roles',
    profile = 'profiles',
}

export class User extends db.Model {
    static tableName = db.Tables.users;
    static relationMappings = {
        [Relations.profile]: {
            relation: db.Model.HasManyRelation,
            modelClass: profile.Profile,
            join: {
                from: `${db.Tables.users}.id`,
                to: `${db.Tables.profiles}.userId`,
            },
        },
    };
    password?: string;
    profiles?: Array<profile.Profile>;

    get profile(): profile.Profile {
        for (const profile of this.profiles) {
            if (!profile.tenantId) {
                return profile;
            }
        }

        return undefined;
    }

    get tenantProfile(): profile.Profile {
        for (const profile of this.profiles) {
            if (profile.tenantId) {
                return profile;
            }
        }

        return undefined;
    }

    $formatJson(json: Pojo): Pojo {
        return _.omit(json, 'password');
    }

    hasRole(role: role.models.Types) {
        return this.tenantProfile.hasRole(role);
    }
}

export class UserBaseInfo extends Mapper {
}

export class UserResponse extends UserBaseInfo {
    id: number = mapper.FIELD_NUM;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    profile: profile.ProfileResponse = new profile.ProfileResponse();
    tenantProfile: profile.ProfileResponse = new profile.ProfileResponse();
}

mapper.registerRelation(UserResponse, 'profile', new mapper.Relation(profile.ProfileResponse));
mapper.registerRelation(UserResponse, 'tenantProfile', new mapper.Relation(profile.ProfileResponse));

export class UserRequest extends UserBaseInfo {
    password: string = mapper.FIELD_STR;
    profile: profile.ProfileRequest = new profile.ProfileRequest();
}

export interface PaginatedUserReponse extends PaginatedResponse {
    items: Array<UserResponse>;
}

export const userRequestSchema = Joi.object().keys({
    password: Joi.string().required(),
    profile: profile.profileRequestSchema.required(),
});

export const userPatchSchema = Joi.object().keys({
    profile: profile.profilePatchSchema.required(),
});
