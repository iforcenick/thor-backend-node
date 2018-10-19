import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation, Pojo} from 'objection'; // for ManyToManyRelation compilation
import * as profile from '../profile/models';
import * as role from './role';
import Joi = require('joi');
import _ from 'lodash';
import {Transaction, TransactionResponse} from '../transaction/models';
import {Errors} from 'typescript-rest';

export const enum Relations {
    roles = 'roles',
    profile = 'profiles',
    tenantProfile = 'tenantProfile',
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
        [Relations.tenantProfile]: {
            relation: db.Model.HasOneRelation,
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
    password?: string = null;
    deletedAt?: Date = null;
    profiles?: Array<profile.Profile>;
    transactions?: Array<Transaction>;
    lastActivity?: Date;
    tenantProfile?: profile.Profile;

    hasRole(role: role.models.Types) {
        return this.tenantProfile.hasRole(role);
    }

    isContractor() {
        return this.hasRole(role.models.Types.contractor);
    }
}

export class UserBaseInfo extends Mapper {
}

export class RankingJobsEntry extends Mapper {
    name: string = mapper.FIELD_STR;
    total: string = mapper.FIELD_STR;
    jobs: number = mapper.FIELD_NUM;
}

export class RankingJobs extends Mapper {
    id: string = mapper.FIELD_STR;
    rank: number = mapper.FIELD_NUM;
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    total: number = mapper.FIELD_NUM;
    jobsCount: number = mapper.FIELD_NUM;
    transactionsIds: Array<string> = mapper.FIELD_ARR;
    @mapper.array(RankingJobsEntry)
    jobs: Array<RankingJobsEntry> = mapper.FIELD_ARR;
}

export class UserResponse extends UserBaseInfo {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    lastTransaction: Date = mapper.FIELD_DATE;
    lastActivity: Date = mapper.FIELD_DATE;
    rank: number = mapper.FIELD_NUM;
    prev: number = mapper.FIELD_NUM;
    @mapper.object(profile.ProfileResponse)
    tenantProfile: profile.ProfileResponse = new profile.ProfileResponse();
}

export class UserRequest extends UserBaseInfo {
    password: string = mapper.FIELD_STR;
    @mapper.object(profile.ProfileRequest)
    profile: profile.ProfileRequest = new profile.ProfileRequest();
}

export class BusinessVerifiedRequest extends UserBaseInfo {
    @mapper.object(profile.ProfileRequest)
    profile: profile.ProfileRequest = new profile.BusinessVerifiedRequest();
}

export interface PaginatedUserResponse extends PaginatedResponse {
    items: Array<UserResponse>;
}

export interface PaginatedRankingJobs extends PaginatedResponse {
    items: Array<RankingJobs>;
}

export const userRequestSchema = Joi.object().keys({
    password: Joi.string().allow('', null),
    profile: profile.profileRequestSchema.required(),
});

export const userPatchSchema = Joi.object().keys({
    profile: profile.profilePatchSchema.required(),
});

export const fundingSourceRequestSchema = Joi.object().keys({
    routingNumber: Joi.string().required(),
    accountNumber: Joi.string().required(),
});

export const rankingRequestSchema = Joi.object().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
});

export const businessVerifiedSchema = Joi.object().keys({
    profile: profile.businessVerifiedRequestSchema.required(),
});

export class UserStatisticsResponse extends Mapper {
    rank: string = mapper.FIELD_STR;
    nJobs: string = mapper.FIELD_STR;
    prev: string = mapper.FIELD_STR;
    current: string = mapper.FIELD_STR;
    ytd: string = mapper.FIELD_STR;
}

export class UserDocument extends Mapper {
    type: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    created: Date = mapper.FIELD_DATE;
    failureReason: string = mapper.FIELD_STR;
}