import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';

@Singleton
@AutoWired
export class ProfileService extends db.ModelService<models.Profile> {
    protected modelType = models.Profile;
}
