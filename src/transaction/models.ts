import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import Joi = require('joi');
import * as tenant from '../tenant/models';
import * as user from '../user/models';
import * as job from '../job/models';
import * as transfer from './transfer/models';
import {MAX_VALUE} from '../validation/constants';
import {JobRequest, jobRequestSchema} from '../job/models';

export const enum Relations {
    user = 'user',
    tenant = 'tenant',
    admin = 'admin',
    job = 'job',
    transfer = 'transfer',
}

export const enum Statuses {
    new = 'new',
    pending = 'pending',
    processing = 'processing',
    failed = 'failed',
    reclaimed = 'reclaimed',
    cancelled = 'cancelled',
    processed = 'processed',
}

export class Transaction extends db.Model {
    static tableName = db.Tables.transactions;
    userId?: string = null;
    adminId?: string = null;
    tenantId?: string = null;
    transferId?: string = null;
    jobId?: string = null;
    status?: string = null;
    user?: user.User;
    job?: job.Job;
    transfer?: transfer.Transfer;
    value?: number = null;

    static get relationMappings() {
        return {
            [Relations.user]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: user.User,
                join: {
                    from: `${db.Tables.transactions}.userId`,
                    to: `${db.Tables.users}.id`,
                },
            },
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenant.Tenant,
                join: {
                    from: `${db.Tables.transactions}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
            [Relations.admin]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: user.User,
                join: {
                    from: `${db.Tables.transactions}.adminId`,
                    to: `${db.Tables.users}.id`,
                },
            },
            [Relations.job]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: job.Job,
                join: {
                    from: `${db.Tables.transactions}.jobId`,
                    to: `${db.Tables.jobs}.id`,
                },
            },
            [Relations.transfer]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: transfer.Transfer,
                join: {
                    from: `${db.Tables.transactions}.transferId`,
                    to: `${db.Tables.transfers}.id`,
                },
            },
        };
    }

    static filter(query, startDate?: Date, endDate?: Date, status?: string, userId?: string, jobId?: string) {
        if (startDate && endDate) {
            query.whereBetween(`${db.Tables.transactions}.createdAt`, [startDate, endDate]);
        }

        if (status) {
            query.where(`${db.Tables.transactions}.status`, status);
        }

        if (userId) {
            query.where(`${db.Tables.transactions}.userId`, userId);
        }

        if (jobId) {
            query.where(`${db.Tables.transactions}.jobId`, jobId);
        }
    }

    canBeCancelled() {
        return this.status == Statuses.processing || this.status == Statuses.new;
    }
}

export class TransactionBaseInfo extends Mapper {
    userId: string = mapper.FIELD_STR;
    value: number = mapper.FIELD_NUM;
}

export class TransactionResponse extends TransactionBaseInfo {
    id: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    @mapper.object(job.JobResponse)
    job: job.JobResponse = new job.JobResponse();
    value: number = mapper.FIELD_NUM;
}

export class TransferResponse extends Mapper {
    id: string = mapper.FIELD_STR;
    adminId: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    value: number = mapper.FIELD_NUM;
}

export class PeriodStatsResponse extends Mapper {
    users: number = mapper.FIELD_NUM;
    total: number = mapper.FIELD_NUM;
    startDate: Date = mapper.FIELD_DATE;
    endDate: Date = mapper.FIELD_DATE;
}

export class PeriodsStatsResponse extends Mapper {
    @mapper.object(PeriodStatsResponse)
    previous: PeriodStatsResponse = new PeriodStatsResponse();
    @mapper.object(PeriodStatsResponse)
    current: PeriodStatsResponse = new PeriodStatsResponse();
}

export class TransactionExistingJobRequest extends TransactionBaseInfo {
    jobId: string = mapper.FIELD_STR;
    externalId: string = mapper.FIELD_STR;
}

export class TransactionCustomJobRequest extends TransactionBaseInfo {
    @mapper.object(JobRequest)
    job: JobRequest = new JobRequest();
    externalId: string = mapper.FIELD_STR;
}

export class TransactionPatchRequest extends Mapper {
    jobId: string = mapper.FIELD_STR;
    value: number = mapper.FIELD_NUM;
}

export class TransactionsTransferRequest extends Mapper {
    transactionsIds: Array<string> = Array<string>();
}

export interface PaginatedTransactionResponse extends PaginatedResponse {
    items: Array<TransactionResponse>;
}

export const transactionExistingJobRequestSchema = Joi.object().keys({
    userId: Joi.string().guid(),
    jobId: Joi.string().guid().required(),
    externalId: Joi.string().allow('', null),
    value: Joi.number()
        .max(MAX_VALUE)
        .greater(0)
        .precision(2)
        .strict().allow('', null),
}).xor('userId', 'externalId');

export const transactionCustomJobRequestSchema = Joi.object().keys({
    userId: Joi.string().guid(),
    job: jobRequestSchema.required(),
    externalId: Joi.string().allow('', null),
    value: Joi.number()
        .max(MAX_VALUE)
        .greater(0)
        .precision(2)
        .strict().allow('', null),
}).xor('userId', 'externalId');

export const transactionPatchRequestSchema = Joi.object().keys({
    jobId: Joi.string().guid(),
    value: Joi.number().greater(0).integer().max(MAX_VALUE),
});

export class InvalidTransferDataError extends Error {}
