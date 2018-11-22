import {Logic} from '../logic';
import {AutoWired, Inject} from 'typescript-ioc';
import {MailerService} from '../mailer';
import {InvitationService} from './service';
import * as models from './models';
import {Invitation} from './models';
import {TenantService} from '../tenant/service';
import {Config} from '../config';
import {Logger} from '../logger';
import {ProfileService} from '../profile/service';
const parse = require('csv-parse/lib/sync');

@AutoWired
export class BatchInvitationsLogic extends Logic {
    @Inject mailer: MailerService;
    @Inject invitations: InvitationService;
    @Inject tenants: TenantService;
    @Inject profiles: ProfileService;
    @Inject config: Config;
    @Inject logger: Logger;

    async execute(buffer: Buffer): Promise<Array<Invitation>> {
        const invitations = new Array<Invitation>();

        const parser1 = parse(buffer.toString(), {
            skip_empty_lines: true,
        });

        for (let i = 1; i < parser1.length; i++) {
            const record = parser1[i][0].split(';');
            if (record[0]) {
                const invitationPrototype = {
                    email: record[0],
                    status: models.Status.pending,
                    externalId: ''
                };
                if (record[1]) {
                    invitationPrototype.externalId = record[1];
                }
                invitations.push(Invitation.factory(invitationPrototype));
            }
        }
        const emails = invitations.map(invitation => {
            return invitation.email;
        });
        await this.checkEmailsDuplicates(emails);
        await this.checkExistingUsers(emails);
        if (invitations.some(invitation => invitation.externalId !== '')) {
            const externalIds = invitations.map(invitation => {
                return invitation.externalId;
            });
            await this.checkExternalIdsDuplicates(externalIds);
            await this.checkRegisteredUsersDuplicates(externalIds);
        }

        const tenant = await this.tenants.get(this.context.getTenantId());

        try {
            for (const invitation of invitations) {
                invitation.status = models.Status.sent;
                await this.invitations.insert(invitation)

                this.mailer.sendInvitation(invitation.email, {
                    link: `${this.config.get('application.frontUri')}/on-boarding/${invitation.id}`,
                    companyName: tenant.businessName
                });
            }
            return invitations;
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    private async checkEmailsDuplicates(emails: Array<string>) {
        const result = await this.invitations.getByEmails(emails);

        if (result.length > 0) {
            let errorMessage = 'Emails: ';
            for (const invitation of result) {
                errorMessage += `${invitation.email} `;
            }
            errorMessage += ' are already invited';

            throw new Error(errorMessage);
        }
    }

    private async checkExistingUsers(emails: Array<string>) {
        const profiles = await this.profiles.getByEmails(emails);

        if (profiles.length > 0) {
            let errorMessage = 'Emails: ';
            for (const invitation of profiles) {
                errorMessage += `${invitation.email} `;
            }
            errorMessage += ' are already used';

            throw new Error(errorMessage);
        }
    }

    private async checkExternalIdsDuplicates(externalIds: Array<string>) {
        const duplicates = await this.invitations.getByExternalIds(externalIds);

        if (duplicates.length > 0) {
            let errorMessage = 'External ids: ';
            for (const invitation of duplicates) {
                errorMessage += `${invitation.externalId} `;
            }
            errorMessage += ' are already used';

            throw new Error(errorMessage);
        }
    }

    private async checkRegisteredUsersDuplicates(externalIds: Array<string>) {

        const profiles = await this.profiles.getByExternalIds(externalIds);

        if (profiles.length > 0) {
            let errorMessage = 'External ids: ';
            for (const profile of profiles) {
                errorMessage += `${profile.externalId} `;
            }
            errorMessage += ' are already used';

            throw new Error(errorMessage);
        }
    }
}
