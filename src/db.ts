import {Model as OModel, transaction} from 'objection';
import {Config} from './config';
import {Logger} from './logger';
import {Errors} from '../node_modules/typescript-rest';
import * as _ from 'lodash';
import * as context from './context';

const validate = require('uuid-validate');
const uuid = require('uuid');

export {OModel};

export class Model extends OModel {
    id: string;
    createdAt?: Date = null;
    updatedAt?: Date = null;

    $beforeInsert() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.id = uuid.v4();
    }

    $beforeUpdate() {
        this.updatedAt = new Date();
    }

    static filterFields(json: any) {
        return _.pick(json, Object.keys(new this()));
    }

    static factory(json: any): any {
        return this.fromJson(this.filterFields(json));
    }
}

export const enum Tables {
    users = 'users',
    profiles = 'profiles',
    tenants = 'tenants',
    roles = 'roles',
    profilesRoles = 'profilesRoles',
    transactions = 'transactions',
    jobs = 'jobs',
    transfers = 'transfers',
    contractorInvitations = 'contractorInvitations'
}

export class Pagination {
    total: number;
    limit: number;
    page: number;
    pages: number;

    constructor(page, limit, total: number) {
        this.page = page;
        this.limit = limit;
        this.total = total;
        this.pages = Math.ceil(total / limit);
    }
}

export class Paginated<T> {
    pagination: Pagination;
    rows: Array<T>;

    constructor(pagination: Pagination, rows: Array<T>) {
        this.pagination = pagination;
        this.rows = rows;
    }
}

// WARNING: @Inject only through constructor not field annotation to persist namespace context
export class ModelService<T> {
    protected config: Config;
    protected logger: Logger;
    protected modelType;
    protected tenant: any;

    constructor(config: Config, logger: Logger, tenantContext: context.TenantContext) {
        this.tenant = tenantContext.get();
        this.config = config;
        this.logger = logger;
    }

    getOptions(query) {
        return query;
    }

    getListOptions(query) {
        return query;
    }

    embed(query, embed) {
        return query;
    }

    paginationLimit(limit?: number) {
        if (!limit) {
            return this.config.get('pagination.limit');
        }

        return limit;
    }

    addPagination(query: any, page, limit: number) {
        if (!page) {
            page = 1;
        }

        limit = this.paginationLimit(limit);
        query.page(page - 1, limit);
        return {page, limit};
    }

    async get(id: string): Promise<T> {
        if (!validate(id)) {
            throw new Errors.BadRequestError('Invalid id format');
        }

        const query = this.modelType.query().findById(id);

        this.getOptions(query);

        return await this.useTenantContext(query);
    }

    async getForAllTenants(id: string): Promise<T> {
        if (!validate(id)) {
            return undefined;
        }
        const query = this.modelType.query().findById(id);
        return await this.getOptions(query);
    }

    async getOneBy(field: string, value: any) {
        return await this.useTenantContext(this.getOptions(this.modelType.query().findOne({[field]: value})));
    }

    async list(page?: number, limit?: number, filter?: any, embed?: string): Promise<Paginated<T>> {
        const query = this.modelType.query();

        if (filter) {
            query.where(filter);
        }
        this.embed(query, embed);
        this.getListOptions(query);
        const pag = this.addPagination(query, page, limit);

        const result = await this.useTenantContext(query);
        return new Paginated(new Pagination(pag.page, pag.limit, result.total), result.results);
    }

    transaction(trx?: transaction<any>) {
        if (!trx) {
            return this.modelType.knex();
        }

        return trx;
    }

    useTenantContext(query) {
        return query;
    }

    async insert(entity: OModel, trx?: transaction<any>): Promise<T> {
        const response = await this.modelType
            .query(this.transaction(trx))
            .insert(entity)
            .returning('*');

        if (!(response instanceof Array)) {
            return response;
        } else {
            return response[0];
        }
    }

    async update(entity: OModel, trx?: transaction<any>): Promise<any> {
        return await entity
            .$query(this.transaction(trx))
            .patch(entity)
            .returning('*')
            .first();
    }

    getTenantId(): string {
        return this.tenant;
    }
}
