import Joi = require('joi'); // for ManyToManyRelation compilation
import {PaginatedResponse, mapper} from '../api';
import * as db from '../db';
import {Mapper} from '../mapper';
import {Tenant} from '../tenant/models';
import {User} from '../user/models';
import * as roles from '../user/role/models';

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
    user?: User;
    userId?: string = null;
    tenantId?: string = null;

    static get relationMappings() {
        return {
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: Tenant,
                join: {
                    from: `${db.Tables.invitations}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
            [Relations.user]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: `${db.Tables.invitations}.userId`,
                    to: `${db.Tables.users}.id`,
                },
            },
        };
    }

    static filter(query, status?: string, type?: string) {
        if (status) {
            query.where(`${db.Tables.invitations}.status`, status);
        }

        if (type) {
            query.where(`${db.Tables.invitations}.type`, type);
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

export class InvitationRequest extends InvitationBase {
    type: string = mapper.FIELD_STR;
    role: string = mapper.FIELD_STR;
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

export const userInvitationRequestSchema = Joi.object().keys({
    userId: Joi.string().required(),
});

export const invitationRequestSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    type: Joi.string().valid([Types.contractor, Types.admin]).required(),
    role: Joi.string().when('type', {
        is: Joi.equal(Types.contractor),
        then: Joi.forbidden(),
        otherwise: Joi.required().valid([roles.Types.admin, roles.Types.adminReader]),
    }),
});
