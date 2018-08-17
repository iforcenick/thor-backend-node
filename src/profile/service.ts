import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';

@AutoWired
export class ProfileService extends db.ModelService<models.Profile> {
    protected modelType = models.Profile;

    constructor() {
        // TODO: add model specific profile filter
        super();
        console.log('ProfileService');
    }
}
