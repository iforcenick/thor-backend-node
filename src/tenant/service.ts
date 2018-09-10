import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {ApiServer} from '../server';

@AutoWired
export class TenantService extends db.ModelService<models.Tenant> {
    protected modelType = models.Tenant;

    async getStatistics() {
        const tenantId = this.getTenantId();
        const getQueryForDays = days =>
            ApiServer.db
                .from('users')
                .join('transactions', 'users.id', 'transactions.userId')
                .where({'transactions.tenantId': tenantId})
                // TODO use binding here
                .whereRaw(`"transactions"."createdAt" >= current_date - interval '${days} day'`)
                .countDistinct('transactions.userId')
                .first();
        const totalQuery = ApiServer.db
            .from('profiles')
            .where({'profiles.tenantId': tenantId})
            .count('id as total')
            .first();
        const [{total: totalRes}, activeRes, resting] = await Promise.all([
            totalQuery,
            getQueryForDays(7),
            getQueryForDays(30),
        ]);
        const total = parseInt(totalRes);
        const active = {count: parseInt(activeRes.count)};
        active['percent'] = active.count / total * 100;
        resting.count = parseInt(resting.count) - active.count;
        resting.percent = resting.count / total * 100;
        const inactive = {count: total - (active.count + resting.count), percent: 0};
        inactive['percent'] = inactive.count / total * 100;
        return {
            total: total.toFixed(),
            active: {
                count: active.count.toFixed(),
                percent: active['percent'].toFixed(),
            },
            resting: {
                count: resting.count.toFixed(),
                percent: resting['percent'].toFixed(),
            },
            inactive: {
                count: inactive.count.toFixed(),
                percent: inactive['percent'].toFixed(),
            },
        };
    }
}
