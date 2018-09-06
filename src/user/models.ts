import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation, Pojo} from 'objection'; // for ManyToManyRelation compilation
import * as profile from '../profile/models';
import * as role from './role';
import Joi = require('joi');
import _ from 'lodash';
import {Transaction, TransactionResponse} from '../transaction/models';

export const enum Relations {
    roles = 'roles',
    profile = 'profiles',
    transactions = 'transactions',
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
        [Relations.transactions]: {
            relation: db.Model.HasManyRelation,
            modelClass: Transaction,
            join: {
                from: `${db.Tables.users}.id`,
                to: `${db.Tables.transactions}.userId`,
            },
        },
    };
    password?: string;
    deletedAt?: Date;
    profiles?: Array<profile.Profile>;
    transactions?: Array<Transaction>;

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

export class FundingSourceBaseInfo extends Mapper {
    routingNumber: string = mapper.FIELD_STR;
    accountNumber: string = mapper.FIELD_STR;
}

export class FundingSourceResponse extends FundingSourceBaseInfo {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

export class FundingSourceRequest extends FundingSourceBaseInfo {}

export class UserBaseInfo extends Mapper {
}

export class UserResponse extends UserBaseInfo {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    lastTransaction: Date = mapper.FIELD_DATE;
    rank: number = mapper.FIELD_NUM;
    profile: profile.ProfileResponse = new profile.ProfileResponse();
    tenantProfile: profile.ProfileResponse = new profile.ProfileResponse();
    transactions: Array<TransactionResponse> = mapper.FIELD_ARR;
}

mapper.registerRelation(UserResponse, 'profile', new mapper.Relation(profile.ProfileResponse));
mapper.registerRelation(UserResponse, 'tenantProfile', new mapper.Relation(profile.ProfileResponse));
mapper.registerRelation(UserResponse, Relations.transactions, new mapper.ArrayRelation(TransactionResponse));

export class UserRequest extends UserBaseInfo {
    password: string = mapper.FIELD_STR;
    profile: profile.ProfileRequest = new profile.ProfileRequest();
}

export interface PaginatedUserResponse extends PaginatedResponse {
    items: Array<UserResponse>;
}

export const userRequestSchema = Joi.object().keys({
    profile: profile.profileRequestSchema.required(),
});

export const userPatchSchema = Joi.object().keys({
    profile: profile.profilePatchSchema.required(),
});

export const fundingSourceRequestSchema = Joi.object().keys({
    routingNumber: Joi.string().required(),
    accountNumber: Joi.string().required(),
});
