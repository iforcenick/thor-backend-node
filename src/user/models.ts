import * as db from '../db';
import * as profile from '../profile/models';
import * as role from './role';
import {Transaction} from '../transaction/models';

export const enum Relations {
    roles = 'roles',
    profile = 'profiles',
    tenantProfile = 'tenantProfile',
    transactions = 'transactions',
}

export class User extends db.Model {
    static tableName = db.Tables.users;
    static get relationMappings() {
        return {
            [Relations.profile]: {
                relation: db.Model.HasManyRelation,
                modelClass: profile.Profile,
                join: {
                    from: `${db.Tables.users}.id`,
                    to: `${db.Tables.profiles}.userId`,
                },
            },
            [Relations.tenantProfile]: {
                relation: db.Model.HasOneRelation,
                modelClass: profile.Profile,
                join: {
                    from: `${db.Tables.users}.id`,
                    to: `${db.Tables.profiles}.userId`,
                },
            },
            [Relations.transactions]: {
                relation: db.Model.HasManyRelation,
                modelClass: Transaction,
                join: {
                    from: `${db.Tables.users}.id`,
                    to: `${db.Tables.transactions}.userId`,
                },
            }
        };
    }
    password?: string = null;
    deletedAt?: Date = null;
    profiles?: Array<profile.Profile>;
    transactions?: Array<Transaction>;
    lastActivity?: Date;
    tenantProfile?: profile.Profile;
    passwordResetToken?: string = null;
    passwordResetExpiry?: number = null;

    hasRole(role: role.models.Types) {
        return this.tenantProfile.hasRole(role);
    }

    isContractor() {
        return this.hasRole(role.models.Types.contractor);
    }
}


export class SearchCriteria {
    public page: number;
    public limit: number;
    public orderBy?: string;
    public order?: string;
    public contractor?: string;
    public city?: string;
    public state?: string;
}