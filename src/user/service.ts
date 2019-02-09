import {transaction, Transaction} from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {RequestContext} from '../context';
import * as db from '../db';
import * as profile from '../profile/models';
import * as transactions from '../transaction/models';
import * as models from './models';
import * as role from './role';
import {ProfileService} from '../profile/service';

@AutoWired
export class UserService extends db.ModelService<models.User> {
    @Inject protected rolesService: role.service.RoleService;
    @Inject public profileService: ProfileService;

    setRequestContext(requestContext: RequestContext) {
        this.requestContext = requestContext;
        this.profileService.setRequestContext(requestContext);
    }

    protected setModelType() {
        this.modelType = models.User;
    }

    setBasicConditions(query) {
        query
            .whereNull(`${this.modelType.tableName}.deletedAt`)
            .joinRelation(`${models.Relations.tenantProfile}.${profile.Relations.roles}`);
    }

    selectProfileForTenant(query, tenantId) {
        query.mergeEager(`${models.Relations.tenantProfile}(tenantProfile).[${profile.Relations.roles}]`, {
            tenantProfile: builder => {
                builder.where(function() {
                    this.where('tenantId', tenantId).limit(1);
                });
            },
        });
    }

    selectBaseProfile(query) {
        query.mergeEager(`${models.Relations.baseProfile}(baseProfile).[${profile.Relations.roles}]`, {
            baseProfile: builder => {
                builder.where(function() {
                    this.whereNull('tenantId').limit(1);
                });
            },
        });
    }

    selectLastActivity(query) {
        query.select([
            `${db.Tables.users}.*`,
            this.modelType
                .relatedQuery(models.Relations.transactions)
                .select('createdAt')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .as('lastActivity'),
        ]);
    }

    setConditions(query) {
        const tenantId = this.getTenantId();
        this.setBasicConditions(query);
        query.eager({[models.Relations.profiles]: true});

        if (tenantId && tenantId !== db.SYSTEM_TENANT_SKIP) {
            this.selectProfileForTenant(query, tenantId);
        }
        this.selectBaseProfile(query);
        this.selectLastActivity(query);
    }

    filterContractorRole(query) {
        query.where(`${models.Relations.tenantProfile}:roles.name`, role.models.Types.contractor);
    }

    filterContractorStatus(query) {
        query.where(`${models.Relations.tenantProfile}.status`, profile.Statuses.active);
    }

    setListConditions(query) {
        this.filterContractorRole(query);
        this.setConditions(query);
    }

    useTenantContext(query) {
        const tenantId = this.getTenantId();
        if (tenantId && tenantId !== db.SYSTEM_TENANT_SKIP) {
            query.where({
                [`${models.Relations.tenantProfile}.tenantId`]: tenantId,
            });
        }
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
        const query = this.modelType
            .query()
            .where({[`${db.Tables.users}.id`]: userId})
            .whereNot({[`${db.Tables.transactions}.status`]: transactions.Statuses.processed})
            .joinRelation(`${models.Relations.transactions}`)
            .count()
            .first();
        this.filterContractorRole(query);
        this.useTenantContext(query);
        this.setBasicConditions(query);
        const {count} = await query;
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

    async update(user: models.User, trx?: Transaction): Promise<models.User> {
        delete user.lastActivity;
        return await super.update(user, trx);
    }

    async findByEmailAndTenant(email: string, tenantId: string): Promise<models.User> {
        this.setTenantId(tenantId);
        const query = super.query();
        query.where(`${models.Relations.tenantProfile}.email`, email);
        query.first();
        this.clearTenantId();
        return await query;
    }

    async findByPasswordResetToken(resetToken: string) {
        const query = this.modelType.query();
        query.where('passwordResetToken', resetToken);
        query.first();
        return await query;
    }

    async findByExternalIdAndTenant(externalId: string, tenantId: string): Promise<models.User> {
        this.setTenantId(tenantId);
        const query = super.query();
        query.where(`${models.Relations.tenantProfile}.externalId`, externalId);
        query.first();
        this.clearTenantId();
        return await query;
    }

    query(trx?: transaction<any>) {
        const query = this.modelType.query(trx);
        this.setBasicConditions(query);
        this.useTenantContext(query);
        return query;
    }
}
