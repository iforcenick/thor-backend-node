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
import {Logger} from '../logger';
import {Config} from '../config';
import * as context from '../context';
import {JWTTokenProvider} from '../auth/encryption';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

@AutoWired
export class UserService extends db.ModelService<models.User> {
    protected modelType = models.User;
    protected rolesService: role.service.RoleService;
    public profileService: ProfileService;
    private jwtTokenProvider: JWTTokenProvider;

    constructor(@Inject rolesService: role.service.RoleService,
                @Inject profileService: ProfileService,
                @Inject config: Config, @Inject logger: Logger,
                @Inject tenantContext: context.TenantContext, @Inject jwtTokenProvider: JWTTokenProvider) {
        super(config, logger, tenantContext);
        this.rolesService = rolesService;
        this.profileService = profileService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    getMinOptions(query) {
        query
            .whereNull('users.deletedAt')
            .joinRelation(`${models.Relations.profile}.${profile.Relations.roles}`);

        return query;
    }

    getOptions(query) {
        const tenantId = this.getTenantId();
        query = this.getMinOptions(query);
        query.mergeEager(`${models.Relations.profile}(profile).[${profile.Relations.roles}]`, {
            profile: builder => {
                builder.where(function () {
                    this.where('tenantId', tenantId).orWhere('tenantId', null);
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
        return query.where(`${models.Relations.profile}:roles.name`, role.models.Types.customer);
    }

    getListOptions(query) {
        return this.getOptions(this.filterCustomerRole(query));
    }

    useTenantContext(query) {
        return query
            .where({
                [`${models.Relations.profile}.tenantId`]: this.getTenantId()
            });
    }

    private rankingQuery(startDate: Date, endDate: Date, status?: string) {
        const query = this.useTenantContext(this.getMinOptions(this.filterCustomerRole(this.modelType.query())));
        query.joinRelation(models.Relations.transactions);
        query.join(db.Tables.jobs, `${db.Tables.transactions}.jobId`, `${db.Tables.jobs}.id`);
        transactions.Transaction.filter(query, startDate, endDate, status);

        const columns = [
            `${db.Tables.users}.id`,
            `${db.Tables.profiles}.firstName`,
            `${db.Tables.profiles}.lastName`,
        ];

        const totalValue = `sum(${models.Relations.transactions}.quantity * ${db.Tables.jobs}.value)`;

        query.select(columns.concat([
            raw(`${totalValue} as total`),
            raw(`row_number() OVER (ORDER BY coalesce(${totalValue}, 0) desc) AS rank`)
        ]));
        query.groupBy(columns);
        query.orderBy('rank', 'asc');

        return query;
    }

    async getJobsRanking(startDate: Date, endDate: Date, page?: number, limit?: number, status?: string) {
        const query = this.rankingQuery(startDate, endDate, status);
        const pag = this.addPagination(query, page, limit);

        query.mergeEager(`${models.Relations.transactions}(transactions)`, {
            transactions: builder => {
                builder.select([
                    'jobId', 'name',
                    raw('sum(quantity) * value as total'),
                    raw(`count("${db.Tables.transactions}"."jobId") as jobs`),
                ]);
                builder.joinRelation(transactions.Relations.job);
                transactions.Transaction.filter(builder, startDate, endDate, status);

                builder.groupBy(['userId', 'jobId', 'value', 'name']);
            },
        });

        const transactionsQuery = this.modelType.relatedQuery(models.Relations.transactions);
        transactions.Transaction.filter(transactionsQuery, startDate, endDate, status);
        transactionsQuery
            .select(raw('string_agg("transactions"."id"::character varying, \',\')'))
            .groupBy('userId').as('ids');

        query.select(transactionsQuery);

        const results: any = await query;
        return new db.Paginated(new db.Pagination(pag.page, pag.limit, results.total), results.results);
    }

    async createWithProfile(user: models.User, profile: profile.Profile, tenantId?): Promise<models.User> {
        const customerRole = await this.getRole(role.models.Types.customer);
        await transaction(this.transaction(), async trx => {
            user = await this.insert(user, trx);
            const baseProfile = _.clone(profile);
            baseProfile.dwollaUri = undefined;
            baseProfile.dwollaStatus = undefined;
            baseProfile.dwollaSourceUri = undefined;
            profile.userId = user.id;
            baseProfile.userId = user.id;
            await this.profileService.createProfile(profile, [customerRole], trx, false, tenantId);
            await this.profileService.createProfile(baseProfile, [], trx, true, tenantId);
        });

        return user;
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
        await transaction(this.transaction(), async trx => {
            await this.update(user, trx);
            await this.profileService.update(user.tenantProfile, trx);
        });
    }

    async findByEmailAndTenant(email: string, tenantId: string): Promise<models.User> {
        return await this.modelType
            .query()
            .join('profiles', 'users.id', 'profiles.userId')
            .where({'profiles.email': email, 'profiles.tenantId': tenantId})
            .first()
            .eager('profiles.roles');
    }

    async getRole(role: role.models.Types): Promise<role.models.Role> {
        return await this.rolesService.find(role);
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

    async statsForUser({
                           userId,
                           currentStartDate,
                           currentEndDate,
                           previousStartDate,
                           previousEndDate,
                       }: {
        userId: string;
        currentStartDate: string;
        currentEndDate: string;
        previousStartDate: string;
        previousEndDate: string;
    }) {
        const tenantId = this.getTenantId();
        const knex = ApiServer.db;

        const rankQuery = knex.raw(
            `
            select  ranking.rank
from (select *, row_number() OVER (ORDER BY t.total desc) AS rank
      from (select "profiles"."userId" as userId, COALESCE(sum(transactions.quantity * jobs.value), 0) as total
            from "profiles"
                   left join "transactions" on "profiles"."userId" = "transactions"."userId" and
                                               "transactions"."createdAt" between ? and (? :: timestamptz + INTERVAL '1 day ')
                   left join "jobs" on "transactions"."jobId" = "jobs"."id"
            where "profiles"."tenantId" = ?
            group by "profiles"."userId") as t)as ranking
where ranking.userId = ?
`,
            [currentStartDate, currentEndDate, tenantId, userId],
        );
        const query = ApiServer.db
            .from('transactions')
            .where({'transactions.tenantId': tenantId, 'transactions.userId': userId})
            .leftJoin('jobs', 'transactions.jobId', 'jobs.id')
            .whereRaw('"transactions"."createdAt" between ? and ( ? :: timestamptz + INTERVAL \'1 day\')', [
                currentStartDate,
                currentEndDate,
            ])
            .count()
            .select([knex.raw('sum(transactions.quantity * jobs.value) as current')])
            .groupBy('transactions.userId')
            .first();

        const ytdQuery = ApiServer.db
            .from('transactions')
            .where({'transactions.tenantId': tenantId, 'transactions.userId': userId})
            .join('transfers', 'transactions.transferId', 'transfers.id')
            .groupBy('transactions.userId')
            .sum('transfers.value as ytd')
            .first();
        const prevQuery = ApiServer.db
            .from('transactions')
            .where({'transactions.tenantId': tenantId, 'transactions.userId': userId})
            .whereRaw('"transactions"."createdAt" between ? and ( ? :: timestamptz + INTERVAL \'1 day\')', [
                previousStartDate,
                previousEndDate,
            ])
            .join('transfers', 'transactions.transferId', 'transfers.id')
            .orderBy('transfers.createdAt', 'desc')
            .select(['value as prev'])
            .first();
        const [queryResult, rankResult, ytdResult, prevResult] = await Promise.all([
            query,
            rankQuery,
            ytdQuery,
            prevQuery,
        ]);
        const prev = prevResult ? prevResult.prev : 0;
        const ytd = ytdResult ? ytdResult.ytd : 0;
        const nJobs = queryResult ? queryResult.count : 0;
        const current = queryResult ? queryResult.current : 0;
        const rank = rankResult.rows[0] ? rankResult.rows[0].rank : null;
        return {rank, nJobs, prev, current, ytd};
    }
}
