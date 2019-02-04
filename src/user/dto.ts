import Joi = require('joi');
import moment = require('moment');
import {mapper, PaginatedResponse} from '../api';
import {Mapper} from '../mapper';
import * as profile from '../profile/models';
import * as regex from '../validation/regex';

export class UserBaseInfo extends Mapper {}

export class RankingJobsEntry extends Mapper {
    name: string = mapper.FIELD_STR;
    total: number = mapper.FIELD_NUM;
    jobs: number = mapper.FIELD_NUM;
    status: string = mapper.FIELD_STR;
    id: string = mapper.FIELD_STR;
}

export class RankingJobsResponse extends Mapper {
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

export class AdminUserProfileRequest extends Mapper {
    firstName: string = mapper.FIELD_STR;
    lastName: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
    role: string = mapper.FIELD_STR;
}

export class AdminUserRequest extends UserBaseInfo {
    @mapper.object(AdminUserProfileRequest)
    profile: AdminUserProfileRequest = new AdminUserProfileRequest();
}

export interface PaginatedUserResponse extends PaginatedResponse {
    items: Array<UserResponse>;
}

export interface PaginatedRankingJobsResponse extends PaginatedResponse {
    items: Array<RankingJobsResponse>;
}

export const userRequestSchema = Joi.object().keys({
    password: Joi.string().allow('', null),
    profile: profile.profileRequestSchema.required(),
});

export const userPatchSchema = Joi.object().keys({
    profile: profile.profilePatchSchema.required(),
});

export const rankingRequestSchema = Joi.object().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
});

export const adminUserProfileRequestSchema = Joi.object().keys({
    firstName: Joi.string().allow('', null),
    lastName: Joi.string().allow('', null),
    email: Joi.string().required().email(),
    role: Joi.string().required(),
});

export const adminUserRequestSchema = Joi.object().keys({
    profile: adminUserProfileRequestSchema.required(),
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

export const statisticsRequestSchema = Joi.object().keys({
    currentStartDate: Joi.date().required(),
    currentEndDate: Joi.date().required(),
    previousStartDate: Joi.date().required(),
    previousEndDate: Joi.date().required(),
});

export class AddContractorUserRequest extends Mapper {
    @mapper.object(profile.ProfileRequest)
    profile: profile.ProfileRequest = new profile.ProfileRequest();
}

export class AddContractorUserResponse extends Mapper {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    lastActivity: Date = mapper.FIELD_DATE;
    @mapper.object(profile.ProfileResponse)
    tenantProfile: profile.ProfileResponse = new profile.ProfileResponse();
    token: string = mapper.FIELD_STR;
}

const addContractorUserProfileRequestSchema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required().email(),
    phone: Joi.string().allow('', null).regex(regex.phoneRegex),
    dateOfBirth: Joi.date()
        .max(moment(Date.now()).subtract(18, 'years').calendar())
        .error(message => {
            return 'You must be at least 18 years old';
        }),
    country: Joi.string(),
    state: Joi.string().uppercase().length(2),
    city: Joi.string().regex(/[a-zA-Z]+/),
    postalCode: Joi.string(),
    address1: Joi.string().max(50),
    address2: Joi.string().allow('', null).max(50),
    externalId: Joi.string().allow('', null),
});

export const addContractorUserRequestSchema = Joi.object().keys({
    profile: addContractorUserProfileRequestSchema.required(),
});
