import Joi = require('joi');
import {PaginatedResponse, mapper} from '../api';
import * as db from '../db';
import {Mapper} from '../mapper';
import {Tenant} from '../tenant/models';

export const enum Relations {
    tenant = 'tenant',
}

export class Job extends db.Model {
    static tableName = db.Tables.jobs;
    tenantId?: string = null;
    value?: number = null;
    name?: string = null;
    description?: string = null;
    isActive?: boolean = null;
    isCustom?: boolean = null;

    static get relationMappings() {
        return {
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: Tenant,
                join: {
                    from: `${db.Tables.jobs}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
        };
    }

    static filter(query, name: string, isActive?: boolean, isCustom?: boolean) {
        if (name) {
            query.where(`${db.Tables.jobs}.name`, 'ilike', `%${name}%`);
        }

        if (isActive === true) {
            query.where(`${db.Tables.jobs}.isActive`, true);
        } else if (isActive === false) {
            query.where(`${db.Tables.jobs}.isActive`, false);
        }

        if (isCustom === true) {
            query.where(`${db.Tables.jobs}.isCustom`, true);

        } else if (isCustom === false) {
            query.where(`${db.Tables.jobs}.isCustom`, false);
        }
    }

    static orderBy(query, columnName: string, order: string) {
        query.orderBy(columnName, order);
    }
}

export class JobBaseInfo extends Mapper {
    value: number = mapper.FIELD_NUM;
    name: string = mapper.FIELD_STR;
    description: string = mapper.FIELD_STR;
    isCustom: boolean = false;
}

export class JobResponse extends JobBaseInfo {
    id: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
    isActive: boolean = mapper.FIELD_BOOLEAN;
}

export class JobRequest extends JobBaseInfo {
}

export class JobPatchRequest extends JobBaseInfo {
    isActive: boolean = mapper.FIELD_BOOLEAN;
}

export interface PaginatedJobResponse extends PaginatedResponse {
    items: Array<JobResponse>;
}

export const jobRequestSchema = Joi.object().keys({
    value: Joi.number().greater(0).precision(2).strict().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    isActive: Joi.boolean(),
    isCustom: Joi.boolean().default(false),
});

export const jobPatchRequestSchema = Joi.object().keys({
    value: Joi.number().greater(0).precision(2).strict(),
    name: Joi.string(),
    description: Joi.string(),
    isActive: Joi.boolean(),
    isCustom: Joi.boolean().default(false),
});
