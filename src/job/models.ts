import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import {Relation} from 'objection'; // for ManyToManyRelation compilation
import Joi = require('joi');
import * as tenant from '../tenant/models';

export const enum Relations {
    tenant = 'tenant',
}

export class Job extends db.Model {
    static tableName = db.Tables.jobs;
    tenantId?: string;
    value?: number;
    name?: string;
    description?: string;

    static get relationMappings() {
        return {
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenant.Tenant,
                join: {
                    from: `${db.Tables.jobs}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
        };
    }
}

export class JobBaseInfo extends Mapper {
    id: string = mapper.FIELD_STR;
    value: number = mapper.FIELD_NUM;
    name: string = mapper.FIELD_STR;
    description: string = mapper.FIELD_STR;
}

export class JobResponse extends JobBaseInfo {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

export class JobRequest extends JobBaseInfo {
}

export interface PaginatedJobResponse extends PaginatedResponse {
    items: Array<JobResponse>;
}

export const jobRequestSchema = Joi.object().keys({
    id: Joi.string()
        .guid()
        .allow(null),
    value: Joi.number()
        .greater(0)
        .precision(2)
        .strict()
        .required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
});
