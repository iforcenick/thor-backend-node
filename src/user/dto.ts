import BaseJoi = require('joi');
import Extension = require('joi-date-extensions');
import moment = require('moment');
import {mapper, PaginatedResponse} from '../api';
import {Mapper} from '../mapper';
import * as profiles from '../profile/models';
import * as regex from '../validation/regex';

const Joi = BaseJoi.extend(Extension);

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
    @mapper.object(profiles.ProfileResponse)
    tenantProfile: profiles.ProfileResponse = new profiles.ProfileResponse();
}

export class UserPatchRequest extends UserBaseInfo {
    @mapper.object(profiles.ProfilePatchRequest)
    profile: profiles.ProfilePatchRequest = new profiles.ProfilePatchRequest();
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

export const userPatchSchema = Joi.object().keys({
    profile: profiles.profilePatchSchema.required(),
});

export const rankingRequestSchema = Joi.object().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
});

export const adminUserRequestSchema = Joi.object().keys({
    profile: {
        firstName: Joi.string().allow('', null),
        lastName: Joi.string().allow('', null),
        email: Joi.string().required().email(),
        role: Joi.string().required(),
    },
}).requiredKeys('profile');

export class UserStatisticsResponse extends Mapper {
    rank: number = mapper.FIELD_NUM;
    nJobs: number = mapper.FIELD_NUM;
    prev: number = mapper.FIELD_NUM;
    current: number = mapper.FIELD_NUM;
    ytd: number = mapper.FIELD_NUM;
}

export class ContractorOnRetryRequest extends UserBaseInfo {
    @mapper.object(profiles.ProfileBaseInfo)
    profile: profiles.ProfileBaseInfo = new profiles.ProfileBaseInfo();
}

export class ContractorOnRetryResponse extends UserBaseInfo {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    lastActivity: Date = mapper.FIELD_DATE;
    @mapper.object(profiles.ProfileResponse)
    tenantProfile: profiles.ProfileResponse = new profiles.ProfileResponse();
}

export const contractorOnRetryRequestSchema = Joi.object().keys({
    profile: profiles.profileRequestSchema.required(),
});

export const statisticsRequestSchema = Joi.object().keys({
    currentStartDate: Joi.date().required(),
    currentEndDate: Joi.date().required(),
    previousStartDate: Joi.date().required(),
    previousEndDate: Joi.date().required(),
});

export class AddContractorUserRequest extends Mapper {
    @mapper.object(profiles.ProfileRequest)
    profile: profiles.ProfileRequest = new profiles.ProfileRequest();
}

export class AddContractorUserResponse extends Mapper {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    lastActivity: Date = mapper.FIELD_DATE;
    @mapper.object(profiles.ProfileResponse)
    tenantProfile: profiles.ProfileResponse = new profiles.ProfileResponse();
}

export const addContractorUserRequestSchema = Joi.object().keys({
    profile: {
        externalId: Joi.string().allow('', null),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        phone: Joi.string().allow('', null).regex(regex.phoneRegex),
        email: Joi.string().required().email(),
        dateOfBirth: Joi.date().format('YYYY-MM-DD').required()
            .max(moment(Date.now()).subtract(18, 'years').calendar()).error(message => {
                return 'You must be at least 18 years old';
            }),
        ssn: Joi.string().allow('', null),
        country: Joi.string().required(),
        state: Joi.string().required().uppercase().length(2),
        city: Joi.string().required().regex(/[a-zA-Z]+/),
        postalCode: Joi.string().required(),
        address1: Joi.string().required().max(50),
        address2: Joi.string().allow('', null).max(50),
    }
}).requiredKeys('profile');
