import crypto = require('crypto');
import {Logic} from '../logic';
import {UserService} from './service';
import {AutoWired, Inject} from 'typescript-ioc';
import * as transactions from '../transaction/models';
import * as models from './models';
import {SearchCriteria, User} from './models';
import * as objection from 'objection';
import {raw} from 'objection';
import * as db from '../db';
import {SYSTEM_TENANT_SKIP} from '../db';
import {Errors} from 'typescript-rest';
import {ApiServer} from '../server';
import {MailerService} from '../mailer';
import {Logger} from '../logger';
import {Config} from '../config';
import {ProfileService} from '../profile/service';
import * as role from './role';
import {Profile} from '../profile/models';
import {RoleService} from './role/service';
import * as _ from 'lodash';
import {Types} from './role/models';
import {isAdminRole, roleExists} from './role/checks';

const filterByContractor = (query, contractor) => {
    const likeContractor = `%${contractor}%`;
    query.where((builder) => {
        builder.where(`${models.Relations.tenantProfile}.firstName`, 'ilike', likeContractor);
        builder.orWhere(`${models.Relations.tenantProfile}.lastName`, 'ilike', likeContractor);
        builder.orWhere(raw(`concat("${models.Relations.tenantProfile}"."firstName", ' ', "${models.Relations.tenantProfile}"."lastName")`), 'ilike', likeContractor);
    });
};

@AutoWired
export class RatingJobsListLogic extends Logic {
    @Inject private userService: UserService;
    static sortableFields = ['rank', 'firstName', 'lastName', 'total', 'jobsCount'];

    async execute(start, end: Date, page, limit, status?, orderBy?, order?, contractor?: string): Promise<db.Paginated<any>> {
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
            throw new Errors.ConflictError('Invalid order by field, allowed: ' + RatingJobsListLogic.sortableFields.join(', '));
        }

        try {
            order = db.parseOrdering(order);
        } catch (e) {
            throw new Errors.ConflictError(e.message);
        }

        const query = this.rankingQuery(start, end, status, orderBy, order, contractor);
        const pag = this.userService.addPagination(query, page, limit);
        const results = await query;

        return new db.Paginated(new db.Pagination(pag.page, pag.limit, results.total), results.results.map((row, index) => {
            row.ids ? row.transactionsIds = row.ids.split(',') : null;
            row.jobsCount = row.transactions ? row.transactions.length : 0;
            row.rank = this.calcRating(index, pag.page, pag.limit, results.total, orderBy, order, contractor);
            row.total = row.total ? row.total : 0;
            return row;
        }));
    }

    protected calcRating(index, page, limit, total, orderBy, order, contractor) {
        if (!(['rank', 'total'].includes(orderBy)) || contractor) {
            return '-';
        }

        if (order == db.Ordering.desc) {
            return index + 1 + ((page - 1) * limit);
        } else {
            return total - index - ((page - 1) * limit);
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

    protected allContractorsAndTheirTransactions(start, end: Date, status?) {
        const query = this.userService.query();
        this.userService.filterCustomerRole(query);
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
                    'jobId', 'name', 'status', 'transactions.id',
                    raw(`sum("${models.Relations.transactions}".value) as total`),
                    raw(`count("${models.Relations.transactions}"."jobId") as jobs`),
                ]);
                builder.joinRelation(transactions.Relations.job);
                transactions.Transaction.filter(builder, start, end, status);

                builder.groupBy(['userId', 'jobId', `${models.Relations.transactions}.value`, 'name', 'status', 'transactions.id']);
            },
        });
    }

    protected selectTransactionsIds(query: any, start, end: Date, status?) {
        const transactionsQuery = User.relatedQuery(models.Relations.transactions);
        transactions.Transaction.filter(transactionsQuery, start, end, status);
        transactionsQuery
            .select(raw('string_agg("transactions"."id"::character varying, \',\')'))
            .groupBy('userId').as('ids');

        query.select(transactionsQuery);
    }

    protected selectTransactionsValue(query: any, start, end: Date, status?) {
        const transactionsQuery = User.relatedQuery(models.Relations.transactions);
        transactions.Transaction.filter(transactionsQuery, start, end, status);
        transactionsQuery
            .select(raw(`coalesce(sum(value),0)`))
            .groupBy('userId').as('total');

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

    async execute(searchCriteria: SearchCriteria): Promise<db.Paginated<User>> {
        if (!searchCriteria.orderBy) {
            searchCriteria.orderBy = 'lastName';
        }

        if (!searchCriteria.order) {
            searchCriteria.order = db.Ordering.asc;
        }

        if (!UsersListLogic.sortableFields.includes(searchCriteria.orderBy)) {
            throw new Errors.ConflictError('Invalid order by field, allowed: ' + UsersListLogic.sortableFields.join(', '));
        }

        try {
            searchCriteria.order = db.parseOrdering(searchCriteria.order);
        } catch (e) {
            throw new Errors.ConflictError(e.message);
        }

        const options = builder => {
            builder.orderBy(`${searchCriteria.orderBy}`, searchCriteria.order);
        };

        const query = this.userService.listQuery(null, options);
        if (searchCriteria.contractor) {
            filterByContractor(query, searchCriteria.contractor);
        }
        if (searchCriteria.state) {
            query.where(`${models.Relations.tenantProfile}.state`,
                'ilike', `%${searchCriteria.state}%`);
        }
        if (searchCriteria.city) {
            query.where(`${models.Relations.tenantProfile}.city`,
                'ilike', `%${searchCriteria.city}%`);
        }

        const pag = this.userService.addPagination(query, searchCriteria.page, searchCriteria.limit);
        const results = await query;

        return new db.Paginated(new db.Pagination(pag.page, pag.limit, results.total), results.results);
    }
}

@AutoWired
export class UserStatisticsLogic extends Logic {
    @Inject private userService: UserService;

    async execute(userId: string,
                  currentStartDate,
                  currentEndDate,
                  previousStartDate,
                  previousEndDate: Date): Promise<any> {
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
            .whereRaw('"transactions"."createdAt" between ? and ?', [
                currentStartDate,
                currentEndDate,
            ])
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
            .whereRaw('"transactions"."createdAt" between ? and ?', [
                previousStartDate,
                previousEndDate,
            ])
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

        const buffer = await crypto.randomBytes(20);
        user.passwordResetToken = buffer.toString('hex');
        user.passwordResetExpiry = Date.now() + 3600000;    // 1 hr

        // TODO:
        delete user['lastActivity'];
        await this.userService.update(user);

        try {
            const link = `${this.config.get('application.frontUri')}/reset-password/${user.passwordResetToken}`;
            await this.mailerService.sendPasswordReset(user, link);
        } catch (error) {
            this.logger.error(error.message);
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

        const isNewOldPasswordSame = await this.userService.checkPassword(newPassword, user.password);
        if (isNewOldPasswordSame) {
            throw new Errors.ConflictError('New password is the same as the old one');
        }

        // TODO:
        delete user['lastActivity'];
        user.password = await this.userService.hashPassword(newPassword);
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

    async execute(login, firstName, lastName, password, role: string) {
        if (!roleExists(role) || !isAdminRole(role)) {
            throw new Errors.ConflictError('Invalid role');
        }

        if (await this.userService.findByEmailAndTenant(login, SYSTEM_TENANT_SKIP)) {
            throw new Errors.NotAcceptableError('User with selected login already exists');
        }

        let user: User = new User();
        const profile = new Profile();
        profile.email = login;
        profile.firstName = firstName;
        profile.lastName = lastName;
        user.password = await this.userService.hashPassword(password);

        await objection.transaction(this.userService.transaction(), async _trx => {
            user = await this.userService.insert(user, _trx);
            profile.userId = user.id;
            const adminRole = await this.getRole(Types[role]);
            const roles = [adminRole];

            await this.createBaseProfile(profile, roles, _trx);
            user.tenantProfile = await this.createTenantProfile(profile, roles, _trx);
        });

        return user;
    }

    private async createTenantProfile(profile: Profile,
                                      roles: Array<role.models.Role>,
                                      trx: objection.Transaction) {
        profile = await this.profileService.insert(profile, trx);
        await this.addRoles(profile, roles, trx);
        return profile;
    }

    private async createBaseProfile(profile: Profile, roles: Array<role.models.Role>, trx: objection.Transaction) {
        let baseProfile = _.clone(profile);
        baseProfile = await this.profileService.insert(baseProfile, trx, false);
        await this.addRoles(baseProfile, roles, trx);
        return baseProfile;
    }

    private async addRoles(profile: Profile, roles: Array<role.models.Role>, trx: objection.Transaction) {
        profile.roles = [];
        for (const role of roles) {
            await profile.$relatedQuery(models.Relations.roles, trx).relate(role.id);
            profile.roles.push(role);
        }
    }

    async getRole(role: role.models.Types): Promise<role.models.Role> {
        return await this.roleService.find(role);
    }
}

export class DeleteUserLogic extends Logic {
    @Inject service: UserService;

    async execute(user: User): Promise<any> {
        const hasUnpaidTransactions = await this.service.hasUnpaidTransactions(user.id);
        if (hasUnpaidTransactions) {
            throw new Errors.ConflictError('User have unprocessed transactions');
        }

        try {
            await this.service.delete(user);
        } catch (e) {
            throw new Errors.InternalServerError(e);
        }
    }
}