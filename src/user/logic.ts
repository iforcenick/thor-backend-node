import {Logic} from '../logic';
import {UserService} from './service';
import {AutoWired, Inject} from 'typescript-ioc';
import * as transactions from '../transaction/models';
import * as models from './models';
import {User} from './models';
import {raw} from 'objection';
import * as db from '../db';
import {Errors} from 'typescript-rest';
import {ApiServer} from "../server";

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
            row.rank = index + 1;
            row.total = row.total ? row.total : 0;
            return row;
        }));
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

        const columns = [
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

    async execute(page, limit, orderBy?, order?, contractor?: string): Promise<db.Paginated<User>> {
        if (!orderBy) {
            orderBy = 'lastName';
        }

        if (!order) {
            order = db.Ordering.asc;
        }

        if (!UsersListLogic.sortableFields.includes(orderBy)) {
            throw new Errors.ConflictError('Invalid order by field, allowed: ' + UsersListLogic.sortableFields.join(', '));
        }

        try {
            order = db.parseOrdering(order);
        } catch (e) {
            throw new Errors.ConflictError(e.message);
        }

        const options = builder => {
            builder.orderBy(`${orderBy}`, order);
        };

        const query = this.userService.listQuery(null, options);
        if (contractor) {
            filterByContractor(query, contractor);
        }

        const pag = this.userService.addPagination(query, page, limit);
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