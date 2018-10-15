import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import * as tenants from '../tenant/models';
import Joi = require('joi');
import {Relation} from 'objection'; // for ManyToManyRelation compilation

export const enum Relations {
    tenant = 'tenant',
}

export const enum Status {
    pending = 'pending',
    used = 'used',
    registered = 'registered',
}

export class Invitation extends db.Model {
    static tableName = db.Tables.contractorInvitations;
    email?: string = null;
    status?: string = null;
    tenantId?: string = null;

    static get relationMappings() {
        return {
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenants.Tenant,
                join: {
                    from: `${db.Tables.contractorInvitations}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
        };
    }

    static filter(query, status?: string) {
        if (status) {
            query.where(`${db.Tables.contractorInvitations}.status`, status);
        }
    }
}

export class InvitationBase extends Mapper {
    email: string = mapper.FIELD_STR;
}

export class InvitationRequest extends InvitationBase {}

export class InvitationResponse extends InvitationBase {
    id: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

export interface InvitationPaginatedResponse extends PaginatedResponse {
    items: Array<InvitationResponse>;
}

export const requestSchema = Joi.object().keys({
    email: Joi.string().email(),
});
