import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import * as role from './role';
import * as profile from '../profile/models';
import {ProfileService} from '../profile/service';
import {transaction} from 'objection';
import * as _ from 'lodash';
import {ApiServer} from '../server';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('knex');

@AutoWired
export class UserService extends db.ModelService<models.User> {
    protected modelType = models.User;
    protected rolesService: role.service.RoleService;
    public profileService: ProfileService;

    constructor(@Inject rolesService: role.service.RoleService, @Inject profileService: ProfileService) {
        super();
        this.rolesService = rolesService;
        this.profileService = profileService;
    }

    getOptions(query) {
        const tenantId = this.getTenantId();
        query
            .whereNull('users.deletedAt')
            .eager(`[${models.Relations.profile}(profile).[${profile.Relations.roles}],${models.Relations.transactions}(transactions)]`, {
                profile: builder => {
                    builder.orWhere(function () {
                        this.where('tenantId', tenantId).orWhere('tenantId', null);
                    });
                },
                transactions: builder => {
                    builder.orderBy('createdAt', 'desc').limit(1);
                },
            })
            .joinRelation(`${models.Relations.profile}.${profile.Relations.roles}`);

        return query;
    }

    getListOptions(query) {
        return this.getOptions(query).where(`${models.Relations.profile}:roles.name`, role.models.Types.customer);
    }

    tenantContext(query) {
        return query
            .where({
                [`${models.Relations.profile}.tenantId`]: this.getTenantId()
            });
    }

    async getWithTransactions(page?: number,
                              limit?: number,
                              embed?: string,
                              startDate?: string,
                              endDate?: string,
                              status?: string,): Promise<db.Paginated<models.User>> {
        if (!page) {
            page = 1;
        }
        limit = this.paginationLimit(limit);
        const query = this.modelType.query();

        const eagerObject = {
            profiles: {
                roles: {
                    $modify: ['roles'],
                },
                $modify: ['profiles'],
            },
        };
        if (embed.includes('transactions')) {
            eagerObject['transactions'] = {$modify: ['transactions'], job: {$modify: ['job']}};
        }
        const tenantId = this.getTenantId();
        const knex = ApiServer.db;
        const eagerFilters = {
            profiles: builder => {
                const tenantId = this.getTenantId();
                builder.orWhere(function () {
                    this.where('tenantId', tenantId).orWhere('tenantId', null);
                });
            },
            transactions: builder => {
                builder
                    .select(['transactions.*', knex.raw('transactions.quantity * jobs.value as value')])
                    .join('jobs', 'transactions.jobId', 'jobs.id');
                if (startDate && endDate) {
                    builder.whereRaw(
                        '"transactions"."createdAt" between ? and ( ? :: timestamptz + INTERVAL \'1 day\')',
                        [startDate, endDate],
                    );
                }
                if (status) {
                    builder.where('transactions.status', status);
                }
            },
            job: builder => {
                builder.select(['id', 'value', 'name', 'description']);
            },
            roles: builder => {
                builder.select(['name']);
            },
        };
        query.eager(eagerObject, eagerFilters);
        query.joinRelation(`${models.Relations.profile}.${profile.Relations.roles}`).where(`${models.Relations.profile}:roles.name`, role.models.Types.customer);

        query
            .select(['users.id', 'r.rank']).whereNull('users.deletedAt').orderBy('r.rank');
        query.join(
            knex
                .from('users')
                .join('profiles', function () {
                    this.on('profiles.userId', 'users.id').andOn('profiles.tenantId', knex.raw('?', [tenantId]));
                })
                .leftJoin('transactions', function () {
                    this.on('transactions.userId', 'users.id').andOn(
                        knex.raw(`"transactions"."createdAt" between ? and ? :: timestamptz + interval '1 day' `, [
                            startDate,
                            endDate,
                        ]),
                    );
                })
                .leftJoin('jobs', function () {
                    this.on('jobs.id', 'transactions.jobId');
                })
                .groupBy('users.id')
                .select([
                    'users.id',
                    knex.raw(
                        'row_number() OVER (ORDER BY coalesce(sum(transactions.quantity * jobs.value), 0) desc) AS rank',
                    ),
                ])
                .as('r'),
            'r.id',
            'users.id',
        );
        query.page(page - 1, limit);

        const result: any = await this.tenantContext(query);
        return new db.Paginated(new db.Pagination(page, limit, result.total), result.results);
    }

    embed(query, embed) {
        return query;
    }

    async activity() {
        const query = this.modelType.query();
        const tenantId = this.getTenantId();
        query
            .join('profiles', function () {
                this.on('users.id', 'profiles.userId').andOn('profiles.tenantId', knex.raw('?', [tenantId]));
            })
            .join('transactions', 'users.id', 'transactions.userId')
            .join('jobs', 'transactions.jobId', 'jobs.id')
            // .select(['*', knex.raw('transactions.quantity * jobs.value as value')])
            .groupBy('transactions.status')
            .select(['transactions.status']);
        return await query;
    }

    async createWithProfile(user: models.User, profile: profile.Profile): Promise<models.User> {
        const customerRole = await this.getRole(role.models.Types.customer);
        await transaction(this.transaction(), async trx => {
            user = await this.insert(user, trx);
            const baseProfile = _.clone(profile);
            baseProfile.dwollaUri = undefined;
            baseProfile.dwollaStatus = undefined;
            baseProfile.dwollaSourceUri = undefined;
            profile.userId = user.id;
            baseProfile.userId = user.id;
            const profileEntity = await this.profileService.createProfile(profile, [customerRole], trx);
            const baseProfileEntity = await this.profileService.createProfile(baseProfile, [], trx, true);

            // await user.$relatedQuery(models.Relations.profile, trx).relate(profileEntity.id);
            // await user.$relatedQuery(models.Relations.profile, trx).relate(baseProfileEntity.id);
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

    async delete(user: models.User) {
        user.deletedAt = new Date();
        user.tenantProfile.anonymise();

        await transaction(this.transaction(), async trx => {
            await this.update(user);
            await this.profileService.update(user.tenantProfile);
        });
    }

    async findByPhone(phone: string): Promise<models.User> {
        return await this.getOneBy('phone', phone);
    }

    async findByEmail(email: string): Promise<models.User> {
        return await this.modelType
            .query()
            .join('profiles', 'users.id', 'profiles.userId')
            .where('profiles.email', email)
            .first()
            .eager('profiles.roles');
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

    async listWithPayments(page?: number,
                           limit?: number,
                           startDate?: string,
                           endDate?: string): Promise<db.Paginated<models.User>> {
        if (!page) {
            page = 1;
        }

        const tenantId = this.getTenantId();
        const knex = ApiServer.db;
        limit = this.paginationLimit(limit);
        const query = this.modelType.query();
        const eagerObject = {
            [models.Relations.profile]: {
                roles: true,
                $modify: ['profiles'],
            },
        };
        const eagerFilters = {
            profiles: builder => {
                const tenantId = this.getTenantId();
                builder.orWhere(function () {
                    this.where('tenantId', tenantId).orWhere('tenantId', null);
                });
            },
        };
        query.joinRelation(`${models.Relations.profile}.${profile.Relations.roles}`).where(`${models.Relations.profile}:roles.name`, role.models.Types.customer);

        query.join('profiles', function () {
            this.on('users.id', 'profiles.userId').andOn('profiles.tenantId', knex.raw('?', [tenantId]));
        });
        // rank
        query.join(
            knex
                .from('users')
                .join('profiles', function () {
                    this.on('profiles.userId', 'users.id').andOn('profiles.tenantId', knex.raw('?', [tenantId]));
                })
                .leftJoin('transactions', function () {
                    this.on('transactions.userId', 'users.id').andOn(
                        knex.raw(`"transactions"."createdAt" between ? and ? :: timestamptz + interval '1 day' `, [
                            startDate,
                            endDate,
                        ]),
                    );
                })
                .leftJoin('jobs', function () {
                    this.on('jobs.id', 'transactions.jobId');
                })
                .groupBy('users.id')
                .select([
                    'users.id',
                    knex.raw(
                        'row_number() OVER (ORDER BY coalesce(sum(transactions.quantity * jobs.value), 0) desc) AS rank',
                    ),
                ])
                .as('r'),
            'r.id',
            'users.id',
        );
        // lastActivity
        query.join(
            knex
                .from('users')
                .select(['users.id'])
                .max('transactions.createdAt as lastActivity')
                .join('profiles', function () {
                    this.on('profiles.userId', 'users.id').andOn('profiles.tenantId', knex.raw('?', [tenantId]));
                })
                .leftJoin('transactions', function () {
                    this.on('transactions.userId', 'users.id');
                })
                .groupBy('users.id')
                .as('a'),
            'a.id',
            'users.id',
        );
        // prev
        query.join(
            knex
                .distinct(knex.raw(' on (users.id) users.id')).select(['transfers.value'])
                .from('users')
                .join('profiles', function () {
                    this.on('profiles.userId', 'users.id').andOn('profiles.tenantId', knex.raw('?', [tenantId]));
                })
                .leftJoin('transactions', function () {
                    this.on('users.id', 'transactions.userId')
                        .andOn('transactions.tenantId', knex.raw('?', [tenantId]))
                        .andOn(knex.raw('"transactions"."transferId" is not null'));
                })
                .leftJoin('transfers', 'transfers.id', 'transactions.transferId')
                .orderBy('users.id')
                .orderBy('transactions.createdAt', 'desc')
                .as('prev'),
            'prev.id',
            'users.id',
        );
        query.orderBy('r.rank');
        query.select(['users.id', 'r.rank', 'a.lastActivity', 'prev.value as prev']);
        query.eager(eagerObject, eagerFilters);

        query.page(page - 1, limit);

        // const result = await this.tenantContext(query);
        const result: any = await query;
        return new db.Paginated(new db.Pagination(page, limit, result.total), result.results);
    }

    async generateJwt(user: models.User) {
        return jwt.sign(user.toJSON(), this.config.get('authorization.jwtSecret'), {
            expiresIn: this.config.get('authorization.tokenExpirationTime'),
        });
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
        const rankQuery = ApiServer.db.raw(
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
