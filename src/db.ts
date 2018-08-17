import {Model as OModel, transaction} from 'objection';
import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import {Config} from './config';
const validate = require('uuid-validate');

export {OModel};

export class Model extends OModel {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;

    $beforeInsert() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    $beforeUpdate() {
        this.updatedAt = new Date();
    }
}

export class ModelService<T> {
    @Inject protected config: Config;
    protected modelType;
    protected eager = '';

    async get(id: string): Promise<T> {
        if (!validate(id)) {
            return undefined;
        }

        return await this.modelType
            .query()
            .eager(this.eager)
            .findById(id);
    }

    transaction(trx?: transaction<any>) {
        if (!trx) {
            return this.modelType.knex();
        }

        return trx;
    }

    async insert(entity: OModel, trx?: transaction<any>, eager?: boolean): Promise<T> {
        const query = this.modelType.query(this.transaction(trx));
        if (eager) {
            query.eager(this.eager);
        }

        query.insert(entity.toJSON()).returning('*');
        const response = await query;

        if (!(response instanceof Array)) {
            return response;
        } else {
            return response[0];
        }
    }
}