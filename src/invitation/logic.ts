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
import * as parserAsync from 'csv-parse';

@AutoWired
export class BatchInvitationsLogic extends Logic {
    @Inject mailer: MailerService;
    @Inject invitations: InvitationService;
    @Inject tenants: TenantService;
    @Inject profiles: ProfileService;
    @Inject config: Config;
    @Inject logger: Logger;
    private maxRows = this.config.get('invitations.csv.rows');

    async execute(buffer: Buffer): Promise<Array<Invitation>> {
        const parser = new parserAsync.Parser({
            skip_empty_lines: true,
            skip_lines_with_empty_values: true,
            trim: true,
            delimiter: ';',
            from: 2,
            columns: ['email', 'externalId'],
            relax_column_count: true,
            to: this.maxRows,
        });

        parser.write(buffer);
        parser.end();

        if (parser.lines > this.maxRows) {
            throw new Errors.ConflictError(`CSV file has to many rows, max allowed: ${this.maxRows}`);
        }

        const invitations = await new Promise<Array<Invitation>>((resolve, reject) => {
            const invitations: Array<Invitation> = [];
            parser.on('readable', function () {
                let record = null;
                while (record = parser.read()) {
                    if (BatchInvitationsLogic.validateEmail(record.email))
                        invitations.push(Invitation.factory({
                            email: record.email,
                            externalId: record.externalId
                        }));
                }
            });
            parser.on('error', function (err) {
                console.error(err.message);
                reject(err.message);
            });
            parser.on('end', function () {
                resolve(invitations);
            });
        });

        const emails = invitations.map((invitation) => {
            return invitation.email;
        }).filter((email) => {
            return BatchInvitationsLogic.validateEmail(email);
        });

        if (_.isEmpty(emails)) {
            throw new Errors.NotAcceptableError('No emails to import');
        }

        await this.checkEmailsDuplicates(emails);
        await this.checkExistingUsers(emails);

        const externalIds = new Array<string>();
        for (const invitation of invitations) {
            if (invitation.externalId) {
                externalIds.push(invitation.externalId);
            }
        }
        if (externalIds.length > 0) {
            await this.checkExternalIdsDuplicates(externalIds);
            await this.checkRegisteredUsersDuplicates(externalIds);
        }

        const tenant = await this.tenants.get(this.context.getTenantId());
        for (let invitation of invitations) {
            invitation.status = models.Status.sent;
            invitation.tenantId = tenant.id;
            invitation = await this.invitations.insert(invitation);

            try {
                this.mailer.sendInvitation(invitation.email, {
                    link: `${this.config.get('application.frontUri')}/on-boarding/${invitation.id}`,
                    companyName: tenant.businessName
                });
            } catch (error) {
                this.logger.error(error);
            }
        }

        return invitations;

    }

    private async checkEmailsDuplicates(emails: Array<string>) {
        const result = await this.invitations.getByEmails(emails);

        if (!_.isEmpty(result)) {
            return this.parseError('Emails already invited', result.map((inv) => {
                return inv.email;
            }));
        }
    }

    private async checkExistingUsers(emails: Array<string>) {
        const profiles = await this.profiles.getByEmails(emails);

        if (!_.isEmpty(profiles)) {
            return this.parseError('Emails already registered', profiles.map((prof) => {
                return prof.email;
            }));
        }
    }

    private async checkExternalIdsDuplicates(externalIds: Array<string>) {
        const duplicates = await this.invitations.getByExternalIds(externalIds);

        if (!_.isEmpty(duplicates)) {
            return this.parseError('ExternalIds already invited', duplicates.map((inv) => {
                return inv.email;
            }));
        }
    }

    private async checkRegisteredUsersDuplicates(externalIds: Array<string>) {
        const profiles = await this.profiles.getByExternalIds(externalIds);

        if (!_.isEmpty(profiles)) {
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

    private static validateEmail(email: string): boolean {
        if (Joi.validate(email, Joi.string().required().email()).error) {
            return false;
        }
        return true;
    }

}
