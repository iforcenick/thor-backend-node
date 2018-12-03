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

    async insert(transaction: models.Invitation, trx?: objection.Transaction): Promise<models.Invitation> {
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
        const query = this.query();

        return query.whereIn('email', emails);
    }

    getByExternalIds(externalIds: Array<string>): Promise<Array<Invitation>> {
        const query = this.query();
        return query.whereIn('externalId', externalIds);
    }
}
