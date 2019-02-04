import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import * as tenant from '../tenant/models';
import * as user from '../user/models';
import Joi = require('joi'); // for ManyToManyRelation compilation

export const enum Relations {
    tenant = 'tenant',
    user = 'user',
}

export const enum Status {
    pending = 'pending',
    sent = 'sent',
    used = 'used',
}

export const enum Types {
    contractor = 'contractor',
    admin = 'admin',
}

export class Invitation extends db.Model {
    static tableName = db.Tables.invitations;
    email?: string = null;
    status?: string = null;
    type?: string = null;
    user?: user.User;
    userId?: string = null;
    tenantId?: string = null;

    static get relationMappings() {
        return {
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenant.Tenant,
                join: {
                    from: `${db.Tables.invitations}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
            [Relations.user]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: user.User,
                join: {
                    from: `${db.Tables.invitations}.userId`,
                    to: `${db.Tables.users}.id`,
                },
            },
        };
    }

    static filter(query, status?: string, type?: string) {
        if (status) {
            query.where(`${Invitation.tableName}.status`, status);
        }

        if (type) {
            query.where(`${Invitation.tableName}.type`, status);
        }
    }

    isPending() {
        return this.status == Status.pending;
    }

    isContractorInvitation() {
        return this.type == Types.contractor;
    }
}

export class InvitationBase extends Mapper {
    email: string = mapper.FIELD_STR;
}

export class AdminInvitationRequest extends InvitationBase {
    role: string = mapper.FIELD_STR;
}

export class ContractorInvitationRequest extends InvitationBase {
}

export class InvitationResponse extends InvitationBase {
    id: string = mapper.FIELD_STR;
    status: string = mapper.FIELD_STR;
    createdAt: Date = mapper.FIELD_DATE;
    updatedAt: Date = mapper.FIELD_DATE;
}

export interface InvitationPaginatedResponse extends PaginatedResponse {
    items: Array<InvitationResponse>;
}

export class InvitationsResponse extends Mapper {
    public items: Array<InvitationResponse> = mapper.FIELD_ARR;
}

export const adminInvitationRequestSchema = Joi.object().keys({
    email: Joi.string().email(),
});

export const contractorInvitationRequestSchema = Joi.object().keys({
    email: Joi.string().email(),
});
