import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {Logger} from '../logger';
import {Config} from '../config';
import * as context from '../context';
import {transaction} from 'objection';

@AutoWired
export class InvitationService extends db.ModelService<models.Invitation> {
    protected modelType = models.Invitation;

    constructor(@Inject config: Config, @Inject logger: Logger, @Inject tenantContext: context.TenantContext) {
        super(config, logger, tenantContext);
    }

    useTenantContext(query) {
        return query.where(`${db.Tables.contractorInvitations}.tenantId`, this.getTenantId());
    }

    async insert(transaction: models.Invitation, trx?: transaction<any>): Promise<models.Invitation> {
        transaction.tenantId = this.getTenantId();
        return await super.insert(transaction, trx);
    }

    async getByEmail(email: string): Promise<models.Invitation> {
        return await this.getOneBy('email', email);
    }
}
