import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import * as objection from 'objection';

@AutoWired
export class JobService extends db.ModelService<models.Job> {
    async insert(data: models.Job, trx?: objection.Transaction): Promise<models.Job> {
        return await super.insert(data, trx);
    }

    protected setModelType() {
        this.modelType = models.Job;
    }
}
