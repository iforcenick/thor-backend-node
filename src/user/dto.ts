import Joi = require('joi');
import {mapper, PaginatedResponse} from '../api';
import {Mapper} from '../mapper';
import * as profile from '../profile/models';

export class UserBaseInfo extends Mapper {
}

export class RankingJobsEntry extends Mapper {
    name: string = mapper.FIELD_STR;
    total: string = mapper.FIELD_STR;
    jobs: number = mapper.FIELD_NUM;
    status: string = mapper.FIELD_STR;
    id: string = mapper.FIELD_STR;
}

export class RankingJobs extends Mapper {
    id: string = mapper.FIELD_STR;
    rank: number = mapper.FIELD_NUM;
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    total: number = mapper.FIELD_NUM;
    jobsCount: number = mapper.FIELD_NUM;
    transactionsIds: Array<string> = mapper.FIELD_ARR;
    @mapper.array(RankingJobsEntry, 'transactions')
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

export class UserPatchRequest extends UserBaseInfo {
    @mapper.object(profile.ProfilePatchRequest)
    profile: profile.ProfilePatchRequest = new profile.ProfilePatchRequest();
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

export class UserStatisticsResponse extends Mapper {
    rank: number = mapper.FIELD_NUM;
    nJobs: number = mapper.FIELD_NUM;
    prev: number = mapper.FIELD_NUM;
    current: number = mapper.FIELD_NUM;
    ytd: number = mapper.FIELD_NUM;
}

export class UserDocument extends Mapper {
    type: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    created: Date = mapper.FIELD_DATE;
    failureReason: string = mapper.FIELD_STR;
}

export class ContractorOnRetryRequest extends UserBaseInfo {
    @mapper.object(profile.ProfileBaseInfo)
    profile: profile.ProfileBaseInfo = new profile.ProfileBaseInfo();
}

export class ContractorOnRetryResponse extends UserBaseInfo {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    lastActivity: Date = mapper.FIELD_DATE;
    @mapper.object(profile.ProfileResponse)
    tenantProfile: profile.ProfileResponse = new profile.ProfileResponse();
}

export const contractorOnRetryRequestSchema = Joi.object().keys({
    profile: profile.profileRequestSchema.required(),
});