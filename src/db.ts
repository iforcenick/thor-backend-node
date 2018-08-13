import {Model as BaseModel} from 'objection';
import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import {Config} from './config';

export class Model extends BaseModel {
}

export class ModelService<T> {
    @Inject protected config: Config;
    protected modelType;

    async get(id: string) {
        return await this.modelType.query().findById(id);
    }

    async insert(entity): Promise<T> {
        const response = await this.modelType.query().insert(entity.toJSON());

        if (!(response instanceof Array)) {
            return response;
        } else {
            return response[0];
        }
    }
}