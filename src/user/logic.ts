import * as generator from 'generate-password';
import {AutoWired, Inject} from 'typescript-ioc';
import * as _ from 'lodash';
import * as objection from 'objection';
import {Errors} from 'typescript-rest';
import {raw} from 'objection';

import {Logic} from '../logic';
import * as db from '../db';
import {ApiServer} from '../server';
import {Logger} from '../logger';
import {Config} from '../config';
import {isAdminRole, roleExists} from './role/checks';
import * as role from './role';
import {MailerService} from '../mailer';
import {UserService} from './service';
import {ProfileService} from '../profile/service';
import {RoleService} from './role/service';
import * as transactions from '../transaction/models';
import * as models from './models';
import * as profiles from '../profile/models';
import * as roles from './role/models';

const filterByContractor = (query, contractor) => {
    const likeContractor = `%${contractor}%`;
    query.where(builder => {
        builder.where(`${models.Relations.tenantProfile}.firstName`, 'ilike', likeContractor);
        builder.orWhere(`${models.Relations.tenantProfile}.lastName`, 'ilike', likeContractor);
        builder.orWhere(
            raw(
                `concat("${models.Relations.tenantProfile}"."firstName", ' ', "${
                    models.Relations.tenantProfile
                }"."lastName")`,
            ),
            'ilike',
            likeContractor,
        );
    });
};

@AutoWired
export class GetUserLogic extends Logic {
    @Inject private userService: UserService;

    async execute(id: string): Promise<models.User> {
        const user = await this.userService.get(id);

        if (!user) {
            throw new Errors.NotFoundError();
        }
        return user;
    }
}

@AutoWired
export class RatingJobsListLogic extends Logic {
    @Inject private userService: UserService;
    static sortableFields = ['rank', 'firstName', 'lastName', 'total', 'jobsCount'];

    async execute(
        start,
        end: Date,
        page,
        limit,
        status?,
        orderBy?,
        order?,
        contractor?: string,
    ): Promise<db.Paginated<any>> {
        if (!orderBy) {
            orderBy = 'total';
        }

        if (!order) {
            order = db.Ordering.desc;
        }

        order = db.parseOrdering(order);

        // rank is an alias for reverted total set programatically
        if (orderBy == 'rank') {
            orderBy = 'total';
            if (order == db.Ordering.asc) {
                order = db.Ordering.desc;
            } else {
                order = db.Ordering.asc;
            }
        }

        if (!RatingJobsListLogic.sortableFields.includes(orderBy)) {
            throw new Errors.ConflictError(
                'Invalid order by field, allowed: ' + RatingJobsListLogic.sortableFields.join(', '),
            );
        }

        try {
            order = db.parseOrdering(order);
        } catch (e) {
            throw new Errors.ConflictError(e.message);
        }

        const query = this.rankingQuery(start, end, status, orderBy, order, contractor);
        const pag = this.userService.addPagination(query, page, limit);
        const results = await query;

        return new db.Paginated(
            new db.Pagination(pag.page, pag.limit, results.total),
            results.results.map((row, index) => {
                row.ids ? (row.transactionsIds = row.ids.split(',')) : null;
                row.jobsCount = row.transactions ? row.transactions.length : 0;
                row.rank = this.calcRating(index, pag.page, pag.limit, results.total, orderBy, order, contractor);
                row.total = row.total ? row.total : 0;
                return row;
            }),
        );
    }

    protected calcRating(index, page, limit, total, orderBy, order, contractor) {
        if (!['rank', 'total'].includes(orderBy) || contractor) {
            return '-';
        }

        if (order == db.Ordering.desc) {
            return index + 1 + (page - 1) * limit;
        } else {
            return total - index - (page - 1) * limit;
        }
    }

    protected rankingQuery(start, end: Date, status?, orderBy?, order?, contractor?: string) {
        const query = this.allContractorsAndTheirTransactions(start, end, status);
        this.selectJobs(query, start, end, status);
        this.selectTransactionsIds(query, start, end, status);
        this.selectTransactionsValue(query, start, end, status);
        this.setOrdering(query, orderBy, order);

        if (contractor) {
            filterByContractor(query, contractor);
        }

        return query;
    }

    protected allContractorsAndTheirTransactions(start: Date, end: Date, status?: string) {
        const query = this.userService.query();
        this.userService.filterContractorRole(query);
        this.userService.filterContractorStatus(query);
        query.leftJoinRelation(models.Relations.transactions);
        query.leftJoin(db.Tables.jobs, `${db.Tables.transactions}.jobId`, `${db.Tables.jobs}.id`);

        const columns: Array<any> = [
            `${db.Tables.users}.id`,
            `${models.Relations.tenantProfile}.firstName`,
            `${models.Relations.tenantProfile}.lastName`,
        ];

        query.select(columns);
        query.groupBy(columns);

        transactions.Transaction.filter(query, null, null, status);

        return query;
    }

    protected selectJobs(query: any, start, end: Date, status?) {
        query.mergeEager(`${models.Relations.transactions}(transactions)`, {
            transactions: builder => {
                builder.select([
                    'jobId',
                    'name',
                    'status',
                    'transactions.id',
                    raw(`sum("${models.Relations.transactions}".value) as total`),
                    raw(`count("${models.Relations.transactions}"."jobId") as jobs`),
                ]);
                builder.joinRelation(transactions.Relations.job);
                transactions.Transaction.filter(builder, start, end, status);

                builder.groupBy([
                    'userId',
                    'jobId',
                    `${models.Relations.transactions}.value`,
                    'name',
                    'status',
                    'transactions.id',
                ]);
            },
        });
    }

    protected selectTransactionsIds(query: any, start, end: Date, status?) {
        const transactionsQuery = models.User.relatedQuery(models.Relations.transactions);
        transactions.Transaction.filter(transactionsQuery, start, end, status);
        transactionsQuery
            .select(raw('string_agg("transactions"."id"::character varying, \',\')'))
            .groupBy('userId')
            .as('ids');

        query.select(transactionsQuery);
    }

    protected selectTransactionsValue(query: any, start, end: Date, status?) {
        const transactionsQuery = models.User.relatedQuery(models.Relations.transactions);
        transactions.Transaction.filter(transactionsQuery, start, end, status);
        transactionsQuery
            .select(raw(`coalesce(sum(value),0)`))
            .groupBy('userId')
            .as('total');

        query.select(transactionsQuery);
    }

    protected setOrdering(query: any, orderBy, order: string) {
        if (orderBy == 'rank' || orderBy == 'total') {
            if (order == db.Ordering.asc) {
                query.orderBy(orderBy, raw(`ASC NULLS FIRST`));
            } else {
                query.orderBy(orderBy, raw(`DESC NULLS LAST`));
            }
        } else {
            query.orderBy(orderBy, order);
        }
    }
}

@AutoWired
export class UsersListLogic extends Logic {
    @Inject private userService: UserService;
    static sortableFields = ['firstName', 'lastName', 'createdAt', 'lastActivity'];

    async execute(searchCriteria: models.SearchCriteria): Promise<db.Paginated<models.User>> {
        if (!searchCriteria.orderBy) {
            searchCriteria.orderBy = 'lastName';
        }

        if (!searchCriteria.order) {
            searchCriteria.order = db.Ordering.asc;
        }

        if (!UsersListLogic.sortableFields.includes(searchCriteria.orderBy)) {
            throw new Errors.ConflictError(
                'Invalid order by field, allowed: ' + UsersListLogic.sortableFields.join(', '),
            );
        }

        try {
            searchCriteria.order = db.parseOrdering(searchCriteria.order);
        } catch (e) {
            throw new Errors.ConflictError(e.message);
        }

        const options = builder => {
            builder
                .orderBy(`${models.Relations.tenantProfile}.status`, db.Ordering.asc)
                .orderBy(`${searchCriteria.orderBy}`, searchCriteria.order);
        };

        const query = this.userService.listQuery(null, options);
        if (searchCriteria.contractor) {
            filterByContractor(query, searchCriteria.contractor);
        }
        if (searchCriteria.state) {
            query.where(`${models.Relations.tenantProfile}.state`, 'ilike', `%${searchCriteria.state}%`);
        }
        if (searchCriteria.city) {
            query.where(`${models.Relations.tenantProfile}.city`, 'ilike', `%${searchCriteria.city}%`);
        }

        const pag = this.userService.addPagination(query, searchCriteria.page, searchCriteria.limit);
        const results = await query;

        return new db.Paginated(new db.Pagination(pag.page, pag.limit, results.total), results.results);
    }
}

@AutoWired
export class UserStatisticsLogic extends Logic {
    async execute(
        userId: string,
        currentStartDate,
        currentEndDate,
        previousStartDate,
        previousEndDate: Date,
    ): Promise<any> {
        const tenantId = this.context.getTenantId();
        const knex = ApiServer.db;

        const rankQuery = knex.raw(
            `
            select  ranking.rank
from (select *, row_number() OVER (ORDER BY t.total desc) AS rank
      from (select "profiles"."userId" as userId, COALESCE(sum(transactions.value), 0) as total
            from "profiles"
                   left join "transactions" on "profiles"."userId" = "transactions"."userId" and
                                               "transactions"."createdAt" between ? and ?
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
            .whereRaw('"transactions"."createdAt" between ? and ?', [currentStartDate, currentEndDate])
            .count()
            .select([knex.raw('sum(transactions.value) as current')])
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
            .whereRaw('"transactions"."createdAt" between ? and ?', [previousStartDate, previousEndDate])
            .join('transfers', 'transactions.transferId', 'transfers.id')
            .orderBy('transfers.createdAt', 'desc')
            .select(['transfers.value as prev'])
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

@AutoWired
export class CreatePasswordResetLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private mailerService: MailerService;
    @Inject private config: Config;
    @Inject private logger: Logger;

    async execute(userId: string): Promise<any> {
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        user.passwordResetToken = await user.getPasswordResetToken();
        user.passwordResetExpiry = Date.now() + 86400000; // 24 hr
        await this.userService.update(user);

        try {
            const link = `${this.config.get('application.frontUri')}/reset-password/${user.passwordResetToken}`;
            await this.mailerService.sendPasswordReset(user, link);
        } catch (error) {
            this.logger.error(error);
        }
    }
}

@AutoWired
export class ResetPasswordLogic extends Logic {
    @Inject private userService: UserService;

    async execute(resetToken: string, newPassword: string): Promise<any> {
        const user = await this.userService.findByPasswordResetToken(resetToken);
        if (!user) {
            throw new Errors.NotFoundError('Password reset token not found');
        }

        if (user.passwordResetExpiry < Date.now()) {
            throw new Errors.NotAcceptableError('Password reset token has expired');
        }

        const isNewOldPasswordSame = await user.checkPassword(newPassword);
        if (isNewOldPasswordSame) {
            throw new Errors.ConflictError('New password is the same as the old one');
        }

        user.password = await user.hashPassword(newPassword);
        user.passwordResetExpiry = null;
        user.passwordResetToken = null;
        await this.userService.update(user);

        // TODO: send a password has been reset email?
    }
}

@AutoWired
export class GetPasswordResetLogic extends Logic {
    @Inject private userService: UserService;

    async execute(resetToken: string): Promise<any> {
        const user = await this.userService.findByPasswordResetToken(resetToken);
        if (!user) {
            throw new Errors.NotFoundError('Password reset token not found');
        }

        if (user.passwordResetExpiry < Date.now()) {
            throw new Errors.NotAcceptableError('Password reset token has expired');
        }
    }
}

@AutoWired
export class AddAdminUserLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private roleService: RoleService;
    @Inject private profileService: ProfileService;
    @Inject protected logger: Logger;

    async execute(profileData: any, role: string) {
        if (!roleExists(role) || !isAdminRole(role)) {
            throw new Errors.ConflictError('Invalid role');
        }

        // look for profiles associated with the current tenant
        // that either have the same email or the same external id
        const existingTenantProfileQuery = ApiServer.db
            .from('profiles')
            .where('profiles.tenantId', this.context.getTenantId())
            .where('profiles.email', profileData.email)
            .first();

        // look for base profiles (no tenant id) with the same email
        const existingProfileQuery = ApiServer.db
            .from('profiles')
            .where({'profiles.email': profileData.email})
            .whereNull('profiles.tenantId')
            .first();

        const [existingTenantProfileResult, existingProfileResult] = await Promise.all([
            existingTenantProfileQuery,
            existingProfileQuery,
        ]);
        if (existingTenantProfileResult)
            throw new Errors.ConflictError('An admin with that email already exists');

        let user: models.User;
        let tenantProfile: profiles.Profile;
        await objection.transaction(this.userService.transaction(), async _trx => {
            // link the accounts if the email is already associated with an account
            if (existingProfileResult) {
                user = await this.userService.getForAllTenants(existingProfileResult.userId, _trx);
            } else {
                user = models.User.factory({});
                const password = generator.generate({length: 20, numbers: true, uppercase: true});
                user.password = await user.hashPassword(password);
                user = await this.userService.insert(user, _trx);
            }

            // create the tenant profile
            tenantProfile = profiles.Profile.factory(profileData);
            tenantProfile.status = profiles.Statuses.invited;
            tenantProfile.userId = user.id;
            tenantProfile = await this.profileService.insert(tenantProfile, _trx);

            // add a contractor role to the profile
            tenantProfile.roles = [];
            const adminRole = await this.roleService.find(roles.Types[role]);
            await tenantProfile.$relatedQuery(profiles.Relations.roles, _trx).relate(adminRole.id);
            tenantProfile.roles.push(adminRole);

            // update the user return data
            user.tenantProfile = tenantProfile;
        });

        return user;
    }
}

@AutoWired
export class AddContractorUserLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private roleService: RoleService;
    @Inject private profileService: ProfileService;
    @Inject protected logger: Logger;

    async execute(profileData: any) {
        // look for profiles associated with the current tenant
        // that either have the same email or the same external id
        const existingTenantProfileQuery = ApiServer.db
            .from('profiles')
            .where('profiles.tenantId', this.context.getTenantId())
            .andWhere(builder => {
                builder.where('profiles.email', profileData.email);
                if (profileData.externalId) {
                    builder.orWhere('profiles.externalId', profileData.externalId);
                }
            })
            .first();
        // look for base profiles (no tenant id) with the same email
        const existingProfileQuery = ApiServer.db
            .from('profiles')
            .where({'profiles.email': profileData.email})
            .whereNull('profiles.tenantId')
            .first();

        const [existingTenantProfileResult, existingProfileResult] = await Promise.all([
            existingTenantProfileQuery,
            existingProfileQuery,
        ]);
        if (existingTenantProfileResult)
            throw new Errors.ConflictError('contractor with that email or id already exist');

        let user: models.User;
        let tenantProfile: profiles.Profile;
        await objection.transaction(this.userService.transaction(), async _trx => {
            // link the accounts if the email is already associated with an account
            if (existingProfileResult) {
                user = await this.userService.getForAllTenants(existingProfileResult.userId, _trx);
            } else {
                user = models.User.factory({});
                const password = generator.generate({length: 20, numbers: true, uppercase: true});
                user.password = await user.hashPassword(password);
                user = await this.userService.insert(user, _trx);
            }

            // create the tenant profile
            tenantProfile = profiles.Profile.factory(profileData);
            tenantProfile.status = profiles.Statuses.invited;
            tenantProfile.userId = user.id;
            tenantProfile = await this.profileService.insert(tenantProfile, _trx);

            // add a contractor role to the profile
            tenantProfile.roles = [];
            const contractorRole = await this.roleService.find(role.models.Types.contractor);
            await tenantProfile.$relatedQuery(profiles.Relations.roles, _trx).relate(contractorRole.id);
            tenantProfile.roles.push(contractorRole);

            // update the user return data
            user.tenantProfile = tenantProfile;
        });

        return user;
    }
}

@AutoWired
export class DeleteUserLogic extends Logic {
    @Inject userService: UserService;

    async execute(id: string): Promise<any> {
        const user = await this.userService.get(id);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        // TODO: delete the invitation if this user hasn't signed up yet
        // TODO: only delete tenant profile?
        const hasUnpaidTransactions = await this.userService.hasUnpaidTransactions(user.id);
        if (hasUnpaidTransactions) {
            throw new Errors.ConflictError('User have unprocessed transactions');
        }

        try {
            await this.userService.delete(user);
        } catch (e) {
            throw new Errors.InternalServerError(e);
        }
    }
}
