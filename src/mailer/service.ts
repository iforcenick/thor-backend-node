import {Inject, AutoWired} from 'typescript-ioc';
import * as client from './client';
import * as users from '../user/models';
import * as templates from './template';
import {Logger} from '../logger';
import {Config} from '../config';
import {config} from 'winston';
import {FundingSource} from '../foundingSource/models';
import {Tenant} from '../tenant/models';
import {Transaction} from '../transaction/models';

const getDateString = (date: Date = new Date()): string => {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return date.toLocaleString('en-us', options);
};

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
        return await this.send(
            user.tenantProfile.email,
            this.from,
            await template.getSubject(),
            await template.getHtml(),
            await template.getText(),
        );
    }

    /**
     * System sending confirm account link to tenant admin
     *
     * @param {string} email
     * @param {string} companyName
     * @param {string} link
     * @returns
     * @memberof MailerService
     */
    async sendAdminConfirmAccount(email: string, companyName: string, link: string) {
        const params = {
            companyName,
            link,
        };
        const template = new templates.Template();
        template
            .setSubject(`You have been invited to Thor!`)
            .setHtml(templates.TemplatesFiles.ADMIN_INVITATION_HTML)
            .setText(templates.TemplatesFiles.ADMIN_INVITATION_TEXT)
            .setParams(params);
        return await this.send(
                email,
                this.from,
                await template.getSubject(),
                await template.getHtml(),
                await template.getText(),
            );
    }

    /**
     * System sending confirm account link to tenant
     *
     * @param {string} email
     * @param {string} companyName
     * @param {string} link
     * @returns
     * @memberof MailerService
     */
    async sendTenantConfirmAccount(email: string, companyName: string, link: string) {
        const params = {
            companyName,
            link,
        };
        const template = new templates.Template();
        template
            .setSubject(`Your Thor account has been created!`)
            .setHtml(templates.TemplatesFiles.TENANT_WELCOME_HTML)
            .setText(templates.TemplatesFiles.TENANT_WELCOME_TEXT)
            .setParams(params);
        return await this.send(
            email,
            this.from,
            await template.getSubject(),
            await template.getHtml(),
            await template.getText(),
        );
    }

    /**
     * Company sending invite to new contractor
     * @param companyName name of company sending transaction
     * @param link link to the invitation
     */
    async sendInvitation(email: string, {companyName, link}) {
        const params = {
            companyName,
            link,
        };
        const template = new templates.Template();
        template
            .setSubject('You have been invited to GoThor!')
            .setHtml(templates.TemplatesFiles.CONTRACTOR_INVITATION_HTML)
            .setText(templates.TemplatesFiles.CONTRACTOR_INVITATION_TEXT)
            .setParams(params);
        return await this.send(
            email,
            this.from,
            await template.getSubject(),
            await template.getHtml(),
            await template.getText(),
        );
    }

    /**
     * System sending password reset link to user
     *
     * @param {users.User} user
     * @param {string} link
     * @returns
     * @memberof MailerService
     */
    async sendPasswordReset(user: users.User, link: string) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `Follow this link to reset your password for your ${user.tenantProfile.email} account.`,
                `${link}`,
            ],
        };
        const template = new templates.Template();
        template
            .setSubject(`Here's your password reset link`)
            .setHtml(templates.TemplatesFiles.PASSWORD_RESET_HTML)
            .setText(templates.TemplatesFiles.PASSWORD_RESET_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    /************************************************************************/
    /*              Dwolla Customer Funding Source Event Emails             */
    /************************************************************************/

    async sendFundingSourceAdded(user: users.User, fundingSource: FundingSource) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `Your ${fundingSource.name} ${fundingSource.type} account was added on ${getDateString(
                    fundingSource.createdAt,
                )}`,
            ],
            footer: `You’ve agreed that future payments will be processed by Thor Technologies, Inc. via the Dwolla payment system using your ${
                fundingSource.name
            } ${fundingSource.type} account.`,
        };
        const template = new templates.Template();
        template
            .setSubject('Your funding source was added')
            .setHtml(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_ADDED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_ADDED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendFundingSourceRemoved(user: users.User, fundingSource: FundingSource) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `Your ${fundingSource.name} ${fundingSource.type} account was removed on ${getDateString()}`,
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your funding source was removed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_REMOVED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_REMOVED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendFundingSourceVerified(user: users.User, fundingSource: FundingSource) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `Your ${fundingSource.name} ${fundingSource.type} account was verified on ${getDateString()}`,
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your funding source was verified')
            .setHtml(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_VERIFIED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_FUNDING_SOURCE_VERIFIED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerMicrodepositsInitiated(user: users.User, fundingSource: FundingSource) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `Micro-deposits were initiated to your ${fundingSource.name} ${
                    fundingSource.type
                } account on ${getDateString()}`,
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Micro-deposits are pending')
            .setHtml(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_INITIATED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_INITIATED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerMicrodepositsCompleted(user: users.User, fundingSource: FundingSource) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `Micro-deposits were successfully deposited into your ${fundingSource.name} ${
                    fundingSource.type
                } account on ${getDateString()}`,
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Micro-deposits have been deposited')
            .setHtml(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_COMPLETED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_COMPLETED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerMicrodepositsFailed(user: users.User, fundingSource: FundingSource) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `Micro-deposits failed to be deposited into your ${fundingSource.name} ${
                    fundingSource.type
                } account on ${getDateString()}`,
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Micro-deposits have failed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_FAILED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_MICRODEPOSITS_FAILED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    /************************************************************************/
    /*              Dwolla Transaction Event Emails                         */
    /************************************************************************/

    async sendCustomerTransferCreatedSender(
        user: users.User,
        admin: users.User,
        transaction: Transaction,
        fundingSource: FundingSource,
    ) {
        const params = {
            title: 'Payment Notice',
            descriptions: [
                `Hi ${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName},`,
                `A payment initiated to ${user.tenantProfile.firstName} ${
                    user.tenantProfile.lastName
                } has been created. Here are the details of this payment:`,
            ],
            fields: [
                {name: 'Transfer Type:', description: 'Bank Transfer'},
                {name: 'Source:', description: `${fundingSource.name}`},
                {name: 'Recipient:', description: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`},
                {name: 'Amount:', description: transaction.transfer.value},
                {name: 'Date Initiated:', description: getDateString(transaction.transfer.createdAt)},
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('You sent a payment')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(admin, template);
    }

    async sendCustomerTransferCreatedReceiver(user: users.User, tenant: Tenant, transaction: Transaction) {
        const params = {
            title: 'Payment Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `A payment from ${tenant.businessName} has been created. Here are the details of this payment:`,
            ],
            fields: [
                {name: 'Transfer Type:', description: 'Bank Transfer'},
                {name: 'Source:', description: `${tenant.businessName}`},
                {name: 'Destination:', description: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`},
                {name: 'Amount:', description: transaction.transfer.value},
                {name: 'Date Initiated:', description: getDateString(transaction.transfer.createdAt)},
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('You are receiving a payment')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    // async sendRecurringPaymentScheduled(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendRecurringPaymentScheduled')
    //         .setHtml(templates.TemplatesFiles.RECURRING_PAYMENT_SCHEDULED_HTML)
    //         .setText(templates.TemplatesFiles.RECURRING_PAYMENT_SCHEDULED_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    // async sendRecurringPaymentCancelled(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendRecurringPaymentCancelled')
    //         .setHtml(templates.TemplatesFiles.RECURRING_PAYMENT_CANCELLED_HTML)
    //         .setText(templates.TemplatesFiles.RECURRING_PAYMENT_CANCELLED_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    async sendCustomerTransferCancelledSender(
        user: users.User,
        admin: users.User,
        transaction: Transaction,
        fundingSource: FundingSource,
    ) {
        const params = {
            title: 'Payment Notice',
            descriptions: [
                `Hi ${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName},`,
                `Your payment to ${user.tenantProfile.firstName} ${
                    user.tenantProfile.lastName
                } has been cancelled. Here are the details of this payment:`,
            ],
            fields: [
                {name: 'Transfer Type:', description: 'Bank Transfer'},
                {name: 'Source:', description: `${fundingSource.name}`},
                {name: 'Recipient:', description: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`},
                {name: 'Amount:', description: transaction.transfer.value},
                {name: 'Date Initiated:', description: getDateString(transaction.transfer.createdAt)},
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your payment has been cancelled')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_CANCELLED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_CANCELLED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(admin, template);
    }

    async sendCustomerTransferCancelledReceiver(user: users.User, tenant: Tenant, transaction: Transaction) {
        const params = {
            title: 'Payment Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `A payment from ${tenant.businessName} has been cancelled. Here are the details of this payment:`,
            ],
            fields: [
                {name: 'Transfer Type:', description: 'Bank Transfer'},
                {name: 'Source:', description: `${tenant.businessName}`},
                {name: 'Destination:', description: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`},
                {name: 'Amount:', description: transaction.transfer.value},
                {name: 'Date Initiated:', description: getDateString(transaction.transfer.createdAt)},
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your payment has been cancelled')
            .setHtml(templates.TemplatesFiles.CUSTOMER_TRANSFER_CANCELLED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_TRANSFER_CANCELLED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerTransferFailedSender(
        user: users.User,
        admin: users.User,
        transaction: Transaction,
        fundingSource: FundingSource,
    ) {
        const params = {
            title: 'Payment Notice',
            descriptions: [
                `Hi ${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName},`,
                `Your payment to ${user.tenantProfile.firstName} ${
                    user.tenantProfile.lastName
                } has failed. Here are the details of this payment:`,
            ],
            fields: [
                {name: 'Transfer Type:', description: 'Bank Transfer'},
                {name: 'Source:', description: `${fundingSource.name}`},
                {name: 'Recipient:', description: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`},
                {name: 'Amount:', description: transaction.transfer.value},
                {name: 'Date Initiated:', description: getDateString(transaction.transfer.createdAt)},
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your payment has failed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(admin, template);
    }

    async sendCustomerTransferFailedReceiver(user: users.User, tenant: Tenant, transaction: Transaction) {
        const params = {
            title: 'Payment Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `A payment from ${tenant.businessName} has failed. Here are the details of this payment:`,
            ],
            fields: [
                {name: 'Transfer Type:', description: 'Bank Transfer'},
                {name: 'Source:', description: `${tenant.businessName}`},
                {name: 'Destination:', description: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`},
                {name: 'Amount:', description: transaction.transfer.value},
                {name: 'Date Initiated:', description: getDateString(transaction.transfer.createdAt)},
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your payment has failed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerTransferCompletedSender(
        user: users.User,
        admin: users.User,
        transaction: Transaction,
        fundingSource: FundingSource,
    ) {
        const params = {
            title: 'Payment Notice',
            descriptions: [
                `Hi ${admin.tenantProfile.firstName} ${admin.tenantProfile.lastName},`,
                `Your payment to ${user.tenantProfile.firstName} ${
                    user.tenantProfile.lastName
                } has completed. Here are the details of this payment:`,
            ],
            fields: [
                {name: 'Transfer Type:', description: 'Bank Transfer'},
                {name: 'Source:', description: `${fundingSource.name}`},
                {name: 'Recipient:', description: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`},
                {name: 'Amount:', description: transaction.transfer.value},
                {name: 'Date Initiated:', description: getDateString(transaction.transfer.createdAt)},
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your payment has completed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_TEXT)
            .setParams(params);
        return await this.sendTemplate(admin, template);
    }

    async sendCustomerTransferCompletedReceiver(user: users.User, tenant: Tenant, transaction: Transaction) {
        const params = {
            title: 'Payment Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `A payment from ${tenant.businessName} has completed. Here are the details of this payment:`,
            ],
            fields: [
                {name: 'Transfer Type:', description: 'Bank Transfer'},
                {name: 'Source:', description: `${tenant.businessName}`},
                {name: 'Destination:', description: `${user.tenantProfile.firstName} ${user.tenantProfile.lastName}`},
                {name: 'Amount:', description: transaction.transfer.value},
                {name: 'Date Initiated:', description: getDateString(transaction.transfer.createdAt)},
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your payment has completed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    // async sendCustomerBankTransferCreatedSender(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendCustomerBankTransferCreatedSender')
    //         .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_SENDER_HTML)
    //         .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_SENDER_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    // async sendCustomerBankTransferCreatedReceiver(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendCustomerBankTransferCreatedReceiver')
    //         .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_HTML)
    //         .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    // async sendCustomerBankTransferCancelledSender(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendCustomerBankTransferCancelledSender')
    //         .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CANCELLED_SENDER_HTML)
    //         .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CANCELLED_SENDER_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    // async sendCustomerBankTransferCancelledReceiver(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendCustomerBankTransferCancelledReceiver')
    //         .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CANCELLED_RECEIVER_HTML)
    //         .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_CANCELLED_RECEIVER_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    // async sendCustomerBankTransferFailedSender(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendCustomerBankTransferFailedSender')
    //         .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_SENDER_HTML)
    //         .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_SENDER_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    // async sendCustomerBankTransferFailedReceiver(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendCustomerBankTransferFailedReceiver')
    //         .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_HTML)
    //         .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    // async sendCustomerBankTransferCompletedSender(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendCustomerBankTransferCompletedSender')
    //         .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_HTML)
    //         .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    // async sendCustomerBankTransferCompletedReceiver(user: users.User, params: any) {
    //     const template = new templates.Template();
    //     template
    //         .setSubject('sendCustomerBankTransferCompletedReceiver')
    //         .setHtml(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_HTML)
    //         .setText(templates.TemplatesFiles.CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_TEXT)
    //         .setParams(params);
    //     return await this.sendTemplate(user, template);
    // }

    /************************************************************************/
    /*              Dwolla Account Event Emails                             */
    /************************************************************************/

    async sendCustomerCreated(user: users.User) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                'Congrats! Your Thor account was successfully created.',
            ],
            footer:
                'By creating a Thor account you have also agreed to the Dwolla Terms of Service (https://www.dwolla.com/legal/tos/) and Privacy Policy (https://www.dwolla.com/legal/privacy/), and opened a Dwolla account.',
        };
        const template = new templates.Template();
        template
            .setSubject('Your account has been created')
            .setHtml(templates.TemplatesFiles.CUSTOMER_CREATED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_CREATED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerCreatedAndVerified(user: users.User) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                'Congrats! Your Thor account was successfully created and verified.',
            ],
            footer:
                'By creating a Thor account you have also agreed to the Dwolla Terms of Service (https://www.dwolla.com/legal/tos/) and Privacy Policy (https://www.dwolla.com/legal/privacy/), and opened a Dwolla account.',
        };
        const template = new templates.Template();
        template
            .setSubject('Your account has been created')
            .setHtml(templates.TemplatesFiles.CUSTOMER_CREATED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_CREATED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerified(user: users.User) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                'Your account has been successfully verified!',
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your account has been verified')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFIED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFIED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationDocumentRequired(user: users.User) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `Additional documentation is required to verify your account. Please contact support@gothor.com to provide a color copy, non-expired US issued ID (such as a Driver's License), or applicable business documentation.`,
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Verification document is needed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_NEEDED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_NEEDED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationDocumentUploaded(user: users.User) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                'The document you uploaded for account verification was successfully uploaded. You will receive another email when the document has been reviewed. It will either be approved or rejected.',
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Verification document has been uploaded')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_UPLOADED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_UPLOADED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationDocumentApproved(user: users.User) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                'The document you uploaded for account verification was approved',
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Verification document has been approved')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_APPROVED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_APPROVED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationDocumentFailed(user: users.User) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `The document uploaded for account verification was rejected. Please contact support@gothor.com to provide another color copy, non-expired US issued ID (such as a Driver's License), or applicable business documentation.`,
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Verification document has failed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_FAILED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_DOCUMENT_FAILED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerVerificationRetry(user: users.User) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                `Incomplete or incorrect information was received during registration. Please contact support@gothor.com and update your information in order to be verified.`,
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Verification info is needed')
            .setHtml(templates.TemplatesFiles.CUSTOMER_VERIFICATION_RETRY_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_VERIFICATION_RETRY_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }

    async sendCustomerSuspended(user: users.User) {
        const params = {
            title: 'Account Notice',
            descriptions: [
                `Hi ${user.tenantProfile.firstName} ${user.tenantProfile.lastName},`,
                'Your account has been suspended.',
            ],
        };
        const template = new templates.Template();
        template
            .setSubject('Your account has been suspended')
            .setHtml(templates.TemplatesFiles.CUSTOMER_SUSPENDED_HTML)
            .setText(templates.TemplatesFiles.CUSTOMER_SUSPENDED_TEXT)
            .setParams(params);
        return await this.sendTemplate(user, template);
    }
}
