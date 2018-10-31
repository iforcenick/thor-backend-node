import { Inject, AutoWired } from 'typescript-ioc';
import * as client from './client';
import * as users from '../user/models';
import * as tenants from '../tenant/models';
import * as templates from './template';
import { Logger } from '../logger';
import { Config } from '../config';

@AutoWired
export class MailerService {
    @Inject protected config: Config;
    @Inject protected client: client.Client;
    @Inject protected logger: Logger;
    from = 'Thor <support@gothor.com>';

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
    /**
     * Company sending invite to new contractor
     * @param companyName name of company sending transaction
     * @param link link to the invitation
     */
    async sendInvitation(email: string, { companyName, link }) {
        const params = {
            companyName,
            link,
        };
        const template = new templates.Template();
        template
            .setSubject('You have been invited to join Gothor')
            .setHtml(templates.TemplatesFiles.INVITATION_HTML)
            .setText(templates.TemplatesFiles.INVITATION_TEXT)
            .setParams(params);
        return await this.send(email, this.from, await template.getSubject(), await template.getHtml(), await template.getText());
    }

    /**
     * Company sending ACH to user
     * @param name name of company sending transaction
     * @param recipientName name of user receiving transaction
     * @param fundingSource where the payment is being sent
     * @param amount amount of money being transferred
     * @param date date the transaction was created
     */
    async sendCustomerTransferCreatedSender(recipient: users.User, { admin, user, transaction }) {
        const params = {
            name: `${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName}`, // TODO: change to company name
            recipientName: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`,
            fundingSource: transaction.transfer.sourceUri.split('/').pop(), // TODO: change to bank name / account number
            amount: transaction.transfer.value,
            date: transaction.transfer.createdAt
        };
        const template = new templates.Template();
        template
            .setSubject('You sent a payment')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_CREATED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_CREATED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    /**
     * Customer receiving ACH from company
     * @param name name of person receiving transaction
     * @param senderName name of company sending transaction
     * @param fundingSource where the payment is being sent
     * @param amount amount of money being transferred
     * @param date date the transaction was created
     */
    async sendCustomerTransferCreatedReceiver(recipient: users.User, { admin, user, transaction }) {
        const params = {
            name: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`,
            senderName: `${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName}`, // TODO: change to company name
            fundingSource: transaction.transfer.destinationUri.split('/').pop(), // TODO: change to bank name / account number
            amount: transaction.transfer.value,
            date: transaction.transfer.createdAt
        };
        const template = new templates.Template();
        template
            .setSubject('You are receiving a payment')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_CREATED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_CREATED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    async sendRecurringPaymentScheduled(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendRecurringPaymentScheduled')
            .setHtml(templates.TemplatesFiles.RECURRING_PAYMENT_SCHEDULED_HTML)
            .setText(templates.TemplatesFiles.RECURRING_PAYMENT_SCHEDULED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendRecurringPaymentCancelled(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendRecurringPaymentCancelled')
            .setHtml(templates.TemplatesFiles.RECURRING_PAYMENT_CANCELLED_HTML)
            .setText(templates.TemplatesFiles.RECURRING_PAYMENT_CANCELLED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerTransferCancelledSender(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerTransferCancelledSender')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_CANCELLED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_CANCELLED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerTransferCancelledReceiver(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerTransferCancelledReceiver')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_CANCELLED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_CANCELLED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerTransferFailedSender(recipient: users.User, { admin, user, transaction }) {
        const params = {
            name: `${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName}`,
            recipientName: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`,
            fundingSource: transaction.transfer.sourceUri.split('/').pop(),
            amount: transaction.transfer.value,
            date: transaction.transfer.createdAt
        };
        const template = new templates.Template();
        template
            .setSubject('Customer Transfer Failed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_FAILED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_FAILED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    /**
     * Customer receiving ACH from company
     * @param name name of person receiving transaction
     * @param senderName name of company sending transaction
     * @param fundingSource where the payment is being sent
     * @param amount amount of money being transferred
     * @param date date the transaction was created
     */
    async sendCustomerTransferFailedReceiver(recipient: users.User, { admin, user, transaction }) {
        const params = {
            name: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`,
            senderName: `${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName}`, // TODO: change to company name
            fundingSource: transaction.transfer.destinationUri.split('/').pop(), // TODO: change to bank name / account number
            amount: transaction.transfer.value,
            date: transaction.transfer.createdAt
        };
        const template = new templates.Template();
        template
            .setSubject('Customer Transfer Failed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_FAILED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_FAILED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    /**
     * Company sending ACH to user
     * @param name name of company sending transaction
     * @param recipientName name of user receiving transaction
     * @param fundingSource where the payment is being sent
     * @param amount amount of money being transferred
     * @param date date the transaction was created
     */
    async sendCustomerTransferCompletedSender(recipient: users.User, { admin, user, transaction }) {
        const params = {
            name: `${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName}`, // TODO: change to company name
            recipientName: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`,
            fundingSource: transaction.transfer.sourceUri.split('/').pop(), // TODO: change to bank name / account number
            amount: transaction.transfer.value,
            date: transaction.transfer.createdAt
        };
        const template = new templates.Template();
        template
            .setSubject('Customer Transfer Completed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_COMPLETED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_COMPLETED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    /**
     * Customer receiving ACH from company
     * @param name name of person receiving transaction
     * @param senderName name of company sending transaction
     * @param fundingSource where the payment is being sent
     * @param amount amount of money being transferred
     * @param date date the transaction was created
     */
    async sendCustomerTransferCompletedReceiver(recipient: users.User, { admin, user, transaction }) {
        const params = {
            name: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`,
            senderName: `${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName}`, // TODO: change to company name
            fundingSource: transaction.transfer.destinationUri.split('/').pop(), // TODO: change to bank name / account number
            amount: transaction.transfer.value,
            date: transaction.transfer.createdAt
        };
        const template = new templates.Template();
        template
            .setSubject('Customer Transfer Completed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_COMPLETED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_COMPLETED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    async sendCustomerBankTransferCreatedSender(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerBankTransferCreatedSender')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerBankTransferCreatedReceiver(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerBankTransferCreatedReceiver')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerBankTransferCancelledSender(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerBankTransferCancelledSender')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CANCELLED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CANCELLED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerBankTransferCancelledReceiver(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerBankTransferCancelledReceiver')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CANCELLED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CANCELLED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerBankTransferFailedSender(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerBankTransferFailedSender')
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_SENDER_TEXT)
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_SENDER_HTML)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerBankTransferFailedReceiver(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerBankTransferFailedReceiver')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerBankTransferCompletedSender(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerBankTransferCompletedSender')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerBankTransferCompletedReceiver(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerBankTransferCompletedReceiver')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerFundingSourceAdded(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('Customer Funding Source Added')
            .setHtml(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_ADDED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_ADDED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerFundingSourceRemoved(recipient: users.User, { event }) {
        const params = {
            accountId: event._links['resource']['href'].split('/').pop(),
            date: event['created']
        };
        const template = new templates.Template();
        template
            .setSubject('Customer Funding Source Removed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_REMOVED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_REMOVED_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    async sendCustomerFundingSourceVerified(recipient: users.User, { event }) {
        const params = {
            accountId: event._links['resource']['href'].split('/').pop(),
            date: event['created']
        };
        const template = new templates.Template();
        template
            .setSubject('Customer Funding Source Verified')
            .setHtml(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_VERIFIED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_VERIFIED_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    async sendCustomerMicrodepositsInitiated(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerMicrodepositsInitiated')
            .setHtml(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_INITIATED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_INITIATED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerMicrodepositsCompleted(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerMicrodepositsCompleted')
            .setHtml(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_COMPLETED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_COMPLETED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerMicrodepositsFailed(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerMicrodepositsFailed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_FAILED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_FAILED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerCreated(recipient: users.User, { user, tenant }) {
        const params = {
            name: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`,
            tenantName: tenant['name']
        };
        const template = new templates.Template();
        template
            .setSubject('Customer Created')
            .setHtml(templates.TemplatesFiles.CUSTOMER_CREATED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_CREATED_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    async sendCustomerVerified(recipient: users.User, { user }) {
        const params = {
            name: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`,
        };
        const template = new templates.Template();
        template
            .setSubject('Customer Verified')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFIED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFIED_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    async sendCustomerSuspended(recipient: users.User, { user }) {
        const params = {
            name: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`,
        };
        const template = new templates.Template();
        template
            .setSubject('Customer Suspended')
            .setHtml(templates.TemplatesFiles.CUSTOMER_SUSPENDED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_SUSPENDED_TEXT)
            .setParams(params);
        return await this.sendTemplate(recipient, template);
    }

    async sendCustomerVerificationDocumentNeeded(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerVerificationDocumentNeeded')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_NEEDED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_NEEDED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationDocumentUploaded(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerVerificationDocumentUploaded')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_UPLOADED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_UPLOADED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationDocumentApproved(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerVerificationDocumentApproved')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_APPROVED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_APPROVED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationDocumentFailed(user: users.User, params: any) {
        const template = new templates.Template();
        template
            .setSubject('sendCustomerVerificationDocumentFailed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_FAILED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_FAILED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

}