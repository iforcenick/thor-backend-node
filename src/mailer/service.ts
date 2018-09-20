import {Inject, AutoWired} from 'typescript-ioc';
import * as client from './client';
import * as users from '../user/models';
import * as tenants from '../tenant/models';
import * as templates from './template';
import {Logger} from '../logger';
import {Config} from '../config';

@AutoWired
export class MailerService {
    @Inject protected config: Config;
    @Inject protected client: client.Client;
    @Inject protected logger: Logger;
    from = 'Yoshi <support@startyoshi.com>';

    async send(to, from, subject, html, text) {
        if (this.config.has('mailer.override.to')) {
            to = this.config.get('mailer.override.to');
        }

        return await this.client.send(to, from, subject, html, text);
    }

    async sendTemplate(user: users.User, template: templates.Template) {
        return await this.send(user.tenantProfile.email, this.from, await template.getSubject(), await template.getHtml(), await template.getText());
    }

    async sendFundingSourceCreated(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendFundingSourceCreated')
            .setHtml(templates.TemplatesFiles.FUNDING_SOURCE_CREATED_HTML)
            .setText(templates.TemplatesFiles.FUNDING_SOURCE_CREATED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendFundingSourceRemoved(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendFundingSourceRemoved')
            .setHtml(templates.TemplatesFiles.FUNDING_SOURCE_REMOVED_HTML)
            .setText(templates.TemplatesFiles.FUNDING_SOURCE_REMOVED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendTransferProcessed(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendTransferProcessed')
            .setHtml(templates.TemplatesFiles.TRANSFER_PROCESSED_HTML)
            .setText(templates.TemplatesFiles.TRANSFER_PROCESSED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendTransferFailed(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendTransferFailed')
            .setHtml(templates.TemplatesFiles.TRANSFER_FAILED_HTML)
            .setText(templates.TemplatesFiles.TRANSFER_FAILED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationRetry(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerVerificationRetry')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_RETRY_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_RETRY_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationDocument(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerVerificationDocument')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationSuspended(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerVerificationSuspended')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_SUSPENDED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_SUSPENDED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }
}