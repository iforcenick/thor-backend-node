import * as db from '../../db';
import * as transaction from '../models';
import {Relation} from 'objection'; // for relations compilation
import * as user from '../../user/models';

export const enum Relations {
    transaction = 'transaction',
    admin = 'admin',
}

export const enum Statuses {
    new = 'new',
    externalProcessing = 'externalProcessing',
}

export class Transfer extends db.Model {
    static tableName = db.Tables.transfers;
    adminId?: string;
    externalId?: string;
    sourceUri?: string;
    destinationUri?: string;
    meta?: string;
    value?: number;
    status?: string;

    static get relationMappings() {
        return {
            [Relations.transaction]: {
                relation: db.Model.HasOneRelation,
                modelClass: transaction.Transaction,
                join: {
                    from: `${db.Tables.transfers}.id`,
                    to: `${db.Tables.transactions}.transferId`
                }
            },
            [Relations.admin]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: user.User,
                join: {
                    from: `${db.Tables.transfers}.adminId`,
                    to: `${db.Tables.users}.id`
                }
            },
        };
    }
}