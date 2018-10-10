import * as db from '../db';
import * as tenant from '../tenant/models';


export const enum Relations {
    tenant = 'tenant'
}

export class FundingSource extends db.Model {
    static tableName = db.Tables.fundingSources;
    routing?: string = null;
    account?: string = null;
    name?: string = null;
    type?: string = null;
    dwollaUri?: string = null;
    tenantId?: string = null;
    profileId?: string = null;
    isDefault?: boolean = null;

    static get relationMappings() {
        return {
            [Relations.tenant]: {
                relation: db.Model.BelongsToOneRelation,
                modelClass: tenant.Tenant,
                join: {
                    from: `${db.Tables.fundingSources}.tenantId`,
                    to: `${db.Tables.tenants}.id`,
                },
            },
        };
    }
}