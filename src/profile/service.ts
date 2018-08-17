import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {transaction} from "objection";

@AutoWired
export class ProfileService extends db.ModelService<models.Profile> {
    protected modelType = models.Profile;

    constructor() {
        // TODO: add model specific profile filter
        super();
    }

    async createProfile(data: any, roles: Array<any>, trx?: transaction<any>) {
        let profile = new models.Profile();
        profile.email = data.email;
        profile.name = data.name;
        profile.phone = data.phone;
        profile.tenantId = this.getTenantId();
        profile = await this.insert(profile, trx);

        for (const role of roles) {
            await profile
                .$relatedQuery(models.Relations.roles, trx)
                .relate(role.id);
        }

        return profile;
    }
}
