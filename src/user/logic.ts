import {Logic} from '../logic';
import {UserService} from './service';
import {AutoWired, Inject} from 'typescript-ioc';
import * as transactions from '../transaction/models';
import * as models from './models';
import {User} from './models';
import {raw} from 'objection';
import * as db from '../db';
import {Errors} from 'typescript-rest';

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
            orderBy = 'rank';
        }

        if (!order) {
            order = 'asc';
        }

        if (!RatingJobsListLogic.sortableFields.includes(orderBy)) {
            throw new Errors.ConflictError('Invalid order by field, allowed: ' + RatingJobsListLogic.sortableFields.join(', '));
        }

        if (order != 'asc' && order != 'desc') {
            throw new Errors.ConflictError('Invalid order, allowed: asc, desc');
        }

        const query = this.rankingQuery(start, end, status, orderBy, order, contractor);
        const pag = this.userService.addPagination(query, page, limit);
        const results = await query;

        return new db.Paginated(new db.Pagination(pag.page, pag.limit, results.total), results.results);
    }

    protected rankingQuery(start, end: Date, status?, orderBy?, order?, contractor?: string) {
        const query = this.allContractorsWithTransactions(start, end, status);
        this.calculateAndGroupByRanking(query);
        this.selectJobs(query, start, end, status);
        this.selectTransactionsIds(query, start, end, status);
        this.setOrdering(query, orderBy, order);

        if (contractor) {
            filterByContractor(query, contractor);
        }

        return query;
    }

    protected allContractorsWithTransactions(start, end: Date, status?) {
        const query = this.userService.useTenantContext(this.userService.getMinOptions(this.userService.filterCustomerRole(User.query())));
        if (status) {
            query.joinRelation(models.Relations.transactions);
        } else {
            query.leftJoinRelation(models.Relations.transactions);
        }
        query.leftJoin(db.Tables.jobs, `${db.Tables.transactions}.jobId`, `${db.Tables.jobs}.id`);
        transactions.Transaction.filter(query, start, end, status, null, true);

        return query;
    }

    protected calculateAndGroupByRanking(query: any) {
        const columns = [
            `${db.Tables.users}.id`,
            `${models.Relations.tenantProfile}.firstName`,
            `${models.Relations.tenantProfile}.lastName`,
        ];

        const totalValue = `sum(${models.Relations.transactions}.quantity * ${db.Tables.jobs}.value)`;

        query.select(columns.concat([
            raw(`coalesce(${totalValue},0) as total`),
            raw(`row_number() OVER (ORDER BY coalesce(${totalValue}, 0) desc) AS rank`)
        ]));
        query.groupBy(columns);
    }

    protected selectJobs(query: any, start, end: Date, status?) {
        query.mergeEager(`${models.Relations.transactions}(transactions)`, {
            transactions: builder => {
                builder.select([
                    'jobId', 'name', 'status', 'transactions.id',
                    raw('sum(quantity) * value as total'),
                    raw(`count("${db.Tables.transactions}"."jobId") as jobs`),
                ]);
                builder.joinRelation(transactions.Relations.job);
                transactions.Transaction.filter(builder, start, end, status);

                builder.groupBy(['userId', 'jobId', 'value', 'name', 'status', 'transactions.id']);
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

    protected setOrdering(query: any, orderBy, order: string) {
        query.orderBy(orderBy, order);
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
            order = 'asc';
        }

        if (!UsersListLogic.sortableFields.includes(orderBy)) {
            throw new Errors.ConflictError('Invalid order by field, allowed: ' + UsersListLogic.sortableFields.join(', '));
        }

        if (order != 'asc' && order != 'desc') {
            throw new Errors.ConflictError('Invalid order, allowed: asc, desc');
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