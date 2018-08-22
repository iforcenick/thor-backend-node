import {Model as OModel, transaction} from 'objection';
import {Inject} from 'typescript-ioc';
import {Config} from './config';
const validate = require('uuid-validate');
const uuid = require('uuid');
const getNamespace = require('continuation-local-storage').getNamespace;

export {OModel};

export class Model extends OModel {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;

    $beforeInsert() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.id = uuid.v4();
    }

    $beforeUpdate() {
        this.updatedAt = new Date();
    }
}

export const enum Tables {
    users = 'users',
    profiles = 'profiles',
    tenants = 'tenants',
    roles = 'roles',
    profilesRoles = 'profilesRoles',
}

// WARNING: @Inject only through constructor not field annotation to persist namespace context
export class ModelService<T> {
    @Inject protected config: Config;
    protected modelType;
    protected tenant: any;

    constructor() {
        this.tenant = getNamespace('authContext').get('tenant');
    }

    getOptions(query) {
        return query;
    }

    async get(id: string): Promise<T> {
        if (!validate(id)) {
            return undefined;
        }

        const query = this.modelType
            .query()
            .findById(id);

        this.getOptions(query);

        return await this.tenantContext(query);
    }

    transaction(trx?: transaction<any>) {
        if (!trx) {
            return this.modelType.knex();
        }

        return trx;
    }

    async tenantContext(query) {
        // TODO: add where on tenantId based on this.tenant
        return await query;
    }

    async insert(entity: OModel, trx?: transaction<any>, eager?: boolean): Promise<T> {
        const response = await this.modelType
            .query(this.transaction(trx))
            .insert(entity.toJSON()).returning('*');

        if (!(response instanceof Array)) {
            return response;
        } else {
            return response[0];
        }
    }

    getTenantId(): string {
        return this.tenant;
    }
}
