import {AutoWired} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import {transaction} from 'objection';
import {Invitation} from './models';
import * as objection from 'objection';

@AutoWired
export class InvitationService extends db.ModelService<models.Invitation> {
    protected setModelType() {
        this.modelType = models.Invitation;
    }

    useTenantContext(query) {
        return query.where(`${db.Tables.contractorInvitations}.tenantId`, this.getTenantId());
    }

    async insert(transaction: models.Invitation, trx?: objection.Transaction): Promise<models.Invitation> {
        transaction.tenantId = this.getTenantId();
        return await super.insert(transaction, trx);
    }

    async getByEmail(email: string): Promise<models.Invitation> {
        return await this.getOneBy('email', email);
    }

    async getByExternalId(externalId: string): Promise<models.Invitation> {
        return await this.getOneBy('externalId', externalId);
    }

    async batchInsert(invitations: Array<Invitation>, trx?: transaction<any>) {
        this.modelType.query(trx).insert(invitations);
    }

    async getByEmails(emails: Array<string>): Promise<Array<Invitation>> {
        return this.useTenantContext(Invitation.query())
            .whereIn('email', emails);
    }

    getByExternalIds(externalIds: Array<string>): Promise<Array<Invitation>> {
    return this.useTenantContext(Invitation.query())
            .whereIn('externalId', externalIds);
    }
}
