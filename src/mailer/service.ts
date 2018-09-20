import {Inject, AutoWired} from 'typescript-ioc';
import * as client from './client';
import * as users from '../user/models';
import * as tenants from '../tenant/models';
import * as templates from './template';
import {Logger} from '../logger';

@AutoWired
export class MailerService {
    @Inject protected client: client.Client;
    @Inject protected logger: Logger;
    from = 'Yoshi <support@startyoshi.com>';

    async send(to, from, subject, html, text) {
        return await this.client.send(to, from, subject, html, text);
    }

    async sendTemplate(user: users.User, template: templates.Template) {
        return await this.send(user.tenantProfile.email, this.from, await template.getSubject(), await template.getHtml(), await template.getText());
    }
}