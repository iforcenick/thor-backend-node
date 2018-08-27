import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';

@AutoWired
export class RankService extends db.ModelService<models.Rank> {
    protected modelType = models.Rank;

    getOptions(query) {
        return query;
    }

    getListOptions(query) {
        return this.getOptions(query).groupBy('userId').select('userId').sum('rank as rank');
    }
}
