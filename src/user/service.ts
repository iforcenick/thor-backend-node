import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import * as role from './role';
import * as profile from '../profile/models';
import * as transactions from '../transaction/models';
import {ProfileService} from '../profile/service';
import {raw, transaction} from 'objection';
import * as _ from 'lodash';
import {ApiServer} from '../server';
import {JWTTokenProvider} from '../auth/encryption';
import {RequestContext} from '../context';

const bcrypt = require('bcrypt');

@AutoWired
export class UserService extends db.ModelService<models.User> {
    @Inject protected rolesService: role.service.RoleService;
    @Inject public profileService: ProfileService;
    @Inject private jwtTokenProvider: JWTTokenProvider;

    setRequestContext(requestContext: RequestContext) {
        this.requestContext = requestContext;
        this.profileService.setRequestContext(requestContext);
    }

    protected setModelType() {
        this.modelType = models.User;
    }

    getMinOptions(query) {
        query
            .whereNull(`${this.modelType.tableName}.deletedAt`)
            .joinRelation(`${models.Relations.tenantProfile}.${profile.Relations.roles}`);

        return query;
    }

    getOptions(query) {
        const tenantId = this.getTenantId();
        query = this.getMinOptions(query);
        query.mergeEager(`${models.Relations.tenantProfile}(tenantProfile).[${profile.Relations.roles}]`, {
            tenantProfile: builder => {
                builder.where(function () {
                    this.where('tenantId', tenantId).limit(1);
                });
            },
        });

        query.select([
            `${db.Tables.users}.*`,
            this.modelType.relatedQuery(models.Relations.transactions)
                .select('createdAt').orderBy('createdAt', 'desc').limit(1).as('lastActivity')
        ]);

        return query;
    }

    filterCustomerRole(query) {
        return query.where(`${models.Relations.tenantProfile}:roles.name`, role.models.Types.contractor);
    }

    getListOptions(query) {
        return this.getOptions(this.filterCustomerRole(query));
    }

    useTenantContext(query) {
        return query
            .where({
                [`${models.Relations.tenantProfile}.tenantId`]: this.getTenantId()
            });
    }

    async deleteFull(id: string) {
        const user = await this.getForAllTenants(id);
        user.deletedAt = new Date();
        await transaction(this.transaction(), async trx => {
            user.profiles.forEach(async p => {
                p.anonymise();
                await this.profileService.update(p, trx);
            });

            await this.update(user, trx);
        });
    }

    async hasUnpaidTransactions(userId: string) {
        const query = this.modelType.query()
            .where({[`${db.Tables.users}.id`]: userId})
            .whereNot({[`${db.Tables.transactions}.status`]: transactions.Statuses.processed})
            .joinRelation(`${models.Relations.transactions}`)
            .count().first();
        const {count} = await this.getMinOptions(this.useTenantContext(this.filterCustomerRole(query)));
        return parseInt(count) > 0;
    }

    async delete(user: models.User) {
        user.deletedAt = new Date();
        user.tenantProfile.anonymise();
        delete user.lastActivity;
        await transaction(this.transaction(), async trx => {
            await this.update(user, trx);
            await this.profileService.update(user.tenantProfile, trx);
        });
    }

    async findByEmailAndTenant(email: string, tenantId: string): Promise<models.User> {
        let tmpTenant;
        try {
            tmpTenant = this.getTenantId();
        } catch (e) {
            tmpTenant = null;
        }

        this.setTenantId(tenantId);
        const query = this.useTenantContext(this.getOptions(this.modelType.query()));
        query.where(`${models.Relations.tenantProfile}.email`, email);
        query.first();
        this.setTenantId(tmpTenant);
        return await query;
    }

    async findByExternalIdAndTenant(externalId: string, tenantId: string): Promise<models.User> {
        const tmpTenant = this.getTenantId();
        this.setTenantId(tenantId);
        const query = this.useTenantContext(this.getOptions(this.modelType.query()));
        query.where(`${models.Relations.tenantProfile}.externalId`, externalId);
        query.first();
        this.setTenantId(tmpTenant);
        return await query;
    }

    async checkPassword(password: string, userPassword: string) {
        return await bcrypt.compare(password, userPassword);
    }

    async changePassword(user: models.User, newPassword, oldPassword: string) {
        const isOldPasswordValid = await this.checkPassword(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw Error('Invalid old password');
        }

        const isNewOldPasswordSame = await this.checkPassword(newPassword, user.password);
        if (isNewOldPasswordSame) {
            throw Error('New password is the same as the old one');
        }

        const newPasswordHash = await this.hashPassword(newPassword);
        return user.$query().patch({password: newPasswordHash});
    }

    async authenticate(login: string, password: string, tenant: string) {
        const user = await this.findByEmailAndTenant(login, tenant);
        if (!user) {
            return null;
        }

        const check = await this.checkPassword(password, user.password);

        if (check !== true) {
            return null;
        }
        return user;
    }

    async generateJwt(user: models.User) {
        return this.jwtTokenProvider.generateJwt(user);
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    query(trx?: transaction<any>) {
        const query = this.modelType.query();
        this.getMinOptions(query);
        this.useTenantContext(query);
        return query;
    }
}