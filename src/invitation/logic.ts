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
import * as _ from 'lodash';
import {Errors} from 'typescript-rest';
import Joi = require('joi');

const parse = require('csv-parse/lib/sync');

@AutoWired
export class BatchInvitationsLogic extends Logic {
    @Inject mailer: MailerService;
    @Inject invitations: InvitationService;
    @Inject tenants: TenantService;
    @Inject profiles: ProfileService;
    @Inject config: Config;
    @Inject logger: Logger;
    private emailSchema = Joi.string().email();

    async execute(buffer: Buffer): Promise<Array<Invitation>> {
        const maxRows = this.config.get('invitations.csv.rows');
        let parsed;

        try {
            parsed = parse(buffer, {
                skip_empty_lines: true,
                skip_lines_with_empty_values: true,
                trim: true,
                cast: true,
                delimiter: ';',
                from: 1,
                to: maxRows
            });
        } catch (e) {
            if (_.isNumber(e)) { // to many lines in file, crappy reporting
                throw new Errors.ConflictError(`CSV file has to many rows, max allowed: ${maxRows}`);
            }

            throw e;
        }

        const invitations = parsed.map((row) => {
            const invitation = {
                email: row[0],
                status: models.Status.pending,
                externalId: ''
            };

            if (row[1]) {
                invitation.externalId = row[1];
            }

            return invitation;
        });

        const emails = invitations.map((invitation) => {
            return invitation.email;
        }).filter((email) => {
            return Joi.validate(email, this.emailSchema).error === null;
        });

        if (_.isEmpty(emails)) {
            throw new Errors.NotAcceptableError('No emails to import');
        }

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
                await this.invitations.insert(invitation);

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
            return this.parseError('Emails already invited', result.map((inv) => {
                return inv.email;
            }));
        }
    }

    private async checkExistingUsers(emails: Array<string>) {
        const profiles = await this.profiles.getByEmails(emails);

        if (profiles.length > 0) {
            return this.parseError('Emails already registered', profiles.map((prof) => {
                return prof.email;
            }));
        }
    }

    private async checkExternalIdsDuplicates(externalIds: Array<string>) {
        const duplicates = await this.invitations.getByExternalIds(externalIds);

        if (duplicates.length > 0) {
            return this.parseError('ExternalIds already invited', duplicates.map((inv) => {
                return inv.email;
            }));
        }
    }

    private async checkRegisteredUsersDuplicates(externalIds: Array<string>) {
        const profiles = await this.profiles.getByExternalIds(externalIds);

        if (profiles.length > 0) {
            return this.parseError('ExternalIds already registered', profiles.map((prof) => {
                return prof.email;
            }));
        }
    }

    private parseError(status: string, items: Array<string>) {
        const e: any = new Errors.ConflictError();
        e.message = {
            'status': status,
            'items': items,
        };

        throw e;
    }
}
