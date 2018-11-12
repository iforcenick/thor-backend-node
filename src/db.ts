import {Model as OModel, transaction} from 'objection';
import {Config} from './config';
import {Logger} from './logger';
import {Errors} from '../node_modules/typescript-rest';
import * as _ from 'lodash';
import {ContextAwareInterface, RequestContext, RequestContextMissingError} from './context';
import {Inject} from 'typescript-ioc';

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

    merge(json): any {
        return _.assign(this, _.pick(json, Object.keys(this)));
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
    contractorInvitations = 'contractorInvitations',
    fundingSources = 'fundingSources',
    profilesFundingSources = 'profilesFundingSources'
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
export abstract class ModelService<T extends any> extends ContextAwareInterface {
    @Inject protected config: Config;
    @Inject protected logger: Logger;
    protected modelType: any;
    protected tenant: any;
    protected requestContext: RequestContext;

    protected abstract setModelType();

    protected constructor() {
        super();
        this.setModelType();
    }

    getOptions(query) {
        return query;
    }

    getListOptions(query) {
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

    async get(id: string, trx?: transaction<any>): Promise<T> {
        if (!validate(id)) {
            throw new Errors.NotFoundError('Invalid id format');
        }

        const query = this.modelType.query(trx).findById(id);

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

    async list(page?: number, limit?: number, filter?: any, options?: any): Promise<Paginated<T>> {
        const query = this.modelType.query();
        if (filter) {
            query.where(filter);
        }

        this.getListOptions(query);
        const pag = this.addPagination(query, page, limit);

        if (options) {
            options(query);
        }

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

    async delete(entity: Model, trx?: transaction<any>): Promise<any> {
        return await entity
            .$query(this.transaction(trx))
            .delete()
            .debug()
            .where(`${this.modelType.tableName}.id`, entity.id);
    }

    getTenantId(): string {
        if (this.tenant) {
            return this.tenant;
        }

        return this.getRequestContext().getTenantId();
    }

    setTenantId(id: string) {
        this.tenant = id;
    }
}
