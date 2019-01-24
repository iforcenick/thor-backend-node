import {Model as OModel, transaction} from 'objection';
import {Config} from './config';
import {Logger} from './logger';
import {Errors} from '../node_modules/typescript-rest';
import * as _ from 'lodash';
import {ContextAwareInterface, RequestContext, RequestContextMissingError} from './context';
import {Inject} from 'typescript-ioc';
import * as objection from 'objection';

const validate = require('uuid-validate');
const uuid = require('uuid');

export const SYSTEM_TENANT_SKIP = 'SYSTEM_TENANT_SKIP';

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

export const enum Ordering {
    asc = 'asc',
    desc = 'desc',
}

export const parseOrdering = (ordering) => {
    if (ordering.toLowerCase() == 'asc' || ordering.toLowerCase() == 'ascend') {
        return Ordering.asc;
    } else if (ordering.toLowerCase() == 'desc' || ordering.toLowerCase() == 'descend') {
        return Ordering.desc;
    } else {
        throw new Error('Invalid order, allowed: asc | ascend, desc | descend');
    }
};

export const enum Tables {
    users = 'users',
    profiles = 'profiles',
    tenants = 'tenants',
    roles = 'roles',
    profilesRoles = 'profilesRoles',
    transactions = 'transactions',
    jobs = 'jobs',
    transfers = 'transfers',
    invitations = 'invitations',
    fundingSources = 'fundingSources',
    profilesFundingSources = 'profilesFundingSources',
    passwordReset = 'passwordReset',
    userDocuments = 'userDocuments'
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

    setConditions(query) {
    }

    setListConditions(query) {
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
        this.setConditions(query);
        this.useTenantContext(query);

        return await query;
    }

    async getForAllTenants(id: string, trx?: objection.Transaction): Promise<T> {
        if (!validate(id)) {
            return undefined;
        }
        const query = this.modelType.query(trx).findById(id);
        this.setConditions(query);
        return await query;
    }

    async getOneBy(field: string, value: any) {
        const query = this.modelType.query().findOne({[field]: value});
        this.setConditions(query);
        this.useTenantContext(query);
        return await query;
    }

    listQuery(filter?: any, options?: any): any {
        const query = this.modelType.query();
        if (filter) {
            query.where(filter);
        }

        this.setListConditions(query);

        if (options) {
            options(query);
        }

        this.useTenantContext(query);

        return query;
    }

    async listPaginated(page?: number, limit?: number, filter?: any, options?: any): Promise<Paginated<T>> {
        const query = this.listQuery(filter, options);
        const pag = this.addPagination(query, page, limit);

        const result = await query;

        return new Paginated(new Pagination(pag.page, pag.limit, result.total), result.results);
    }

    transaction(trx?: objection.Transaction) {
        if (!trx) {
            return this.modelType.knex();
        }

        return trx;
    }

    useTenantContext(query) {
        const tenantId = this.getTenantId();
        if (tenantId && tenantId !== SYSTEM_TENANT_SKIP) {
            query.where(`${this.modelType.tableName}.tenantId`, tenantId);
        }
    }

    async insert(entity: OModel, trx?: objection.Transaction, forceTenant?: boolean): Promise<T> {
        if (forceTenant === undefined) {
            forceTenant = true;
        }

        if (_.has(entity, 'tenantId') && forceTenant) {
            if (!entity['tenantId'] && this.getTenantId()) {
                entity['tenantId'] = this.getTenantId();
            }
        }

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

    async update(entity: OModel, trx?: objection.Transaction): Promise<any> {
        return await entity
            .$query(this.transaction(trx))
            .patch(entity)
            .returning('*')
            .first();
    }

    async delete(entity: Model, trx?: objection.Transaction): Promise<any> {
        return await entity
            .$query(this.transaction(trx))
            .delete()
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

    clearTenantId() {
        this.tenant = null;
    }

    query(trx?: transaction<any>) {
        const query = this.modelType.query();
        this.setConditions(query);
        this.useTenantContext(query);
        return query;
    }
}
