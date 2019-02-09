import crypto = require('crypto');
import * as db from '../db';
import {Profile} from '../profile/models';
import {Transaction} from '../transaction/models';
import {Document} from '../document/models';
import {Invitation} from '../invitation/models';
import * as role from './role';

const bcrypt = require('bcrypt');

export const enum Relations {
    roles = 'roles',
    profiles = 'profiles',
    invitation = 'invitation',
    tenantProfile = 'tenantProfile',
    transactions = 'transactions',
    baseProfile = 'baseProfile',
    documents = 'documents',
}

export class User extends db.Model {
    static tableName = db.Tables.users;
    password?: string = null;
    deletedAt?: Date = null;
    profiles?: Array<Profile>;
    documents?: Array<Document>;
    transactions?: Array<Transaction>;
    lastActivity?: Date;
    tenantProfile?: Profile;
    baseProfile?: Profile;
    passwordResetToken?: string = null;
    passwordResetExpiry?: number = null;

    static get relationMappings() {
        return {
            [Relations.invitation]: {
                relation: db.Model.HasOneRelation,
                modelClass: Invitation,
                join: {
                    from: `${db.Tables.users}.id`,
                    to: `${db.Tables.invitations}.userId`,
                },
            },
            [Relations.profiles]: {
                relation: db.Model.HasManyRelation,
                modelClass: Profile,
                join: {
                    from: `${db.Tables.users}.id`,
                    to: `${db.Tables.profiles}.userId`,
                },
            },
            [Relations.tenantProfile]: {
                relation: db.Model.HasOneRelation,
                modelClass: Profile,
                join: {
                    from: `${db.Tables.users}.id`,
                    to: `${db.Tables.profiles}.userId`,
                },
            },
            [Relations.baseProfile]: {
                relation: db.Model.HasOneRelation,
                modelClass: Profile,
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
            },
            [Relations.documents]: {
                relation: db.Model.HasManyRelation,
                modelClass: Document,
                join: {
                    from: `${db.Tables.users}.id`,
                    to: `${db.Tables.documents}.userId`,
                },
            },
        };
    }

    async checkPassword(password: string) {
        return await bcrypt.compare(password, this.password);
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    async getPasswordResetToken() {
        const buffer = await crypto.randomBytes(20);
        return buffer.toString('hex');
    }

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
