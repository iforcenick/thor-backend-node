import * as fs from 'fs';
import * as path from 'path';
import Twig from 'twig';

export interface ITemplate {
    getText(): Promise<string>;

    getHtml(): Promise<string>;

    getSubject(): Promise<string>;

    getParams(): any;

    setParams(params: any): ITemplate;

    setSubject(subject: string): ITemplate;

    setText(source: string): ITemplate;

    setHtml(source: string): ITemplate;
}

export class Template implements ITemplate {
    protected text: string;
    protected html: string;
    protected subject: string;
    protected params: any;

    private readTemplateFile(template) {
        try {
            return fs.readFileSync(path.resolve(__dirname, 'templates', template)).toString('utf8');
        } catch (e) {
            throw new MissingTemplateFileException(e);
        }
    }

    setParams(params): ITemplate {
        this.params = params;
        return this;
    }

    setSubject(subject: string): ITemplate {
        this.subject = subject;
        return this;
    }

    setText(source: string): ITemplate {
        this.text = this.readTemplateFile(source);
        return this;
    }

    setHtml(source: string): ITemplate {
        this.html = this.readTemplateFile(source);
        return this;
    }

    async getText(): Promise<string> {
        return await Twig.twig({ data: this.text }).render(this.params);
    }

    async getHtml(): Promise<string> {
        return await Twig.twig({ data: this.html }).render(this.params);
    }

    async getSubject(): Promise<string> {
        return await Twig.twig({ data: this.subject }).render(this.params);
    }

    getParams(): any {
        return this.params;
    }
}

export class MissingTemplateFileException extends Error {
}

export enum TemplatesFiles {
    TRANSFER_PROCESSED_TEXT = 'transfer_processed_text.twig',
    TRANSFER_PROCESSED_HTML = 'transfer_processed_html.twig',
    CONTRACTOR_INVITATION_TEXT = 'text/contractor_invitation.twig',
    CONTRACTOR_INVITATION_HTML = 'html/contractor_invitation.twig',
    TENANT_WELCOME_TEXT = 'text/tenant_welcome.twig',
    TENANT_WELCOME_HTML = 'html/tenant_welcome.twig',
    ADMIN_INVITATION_TEXT = 'text/admin_invitation.twig',
    ADMIN_INVITATION_HTML = 'html/admin_invitation.twig',
    PASSWORD_RESET_TEXT = 'text/dwolla_event.twig',
    PASSWORD_RESET_HTML = 'html/dwolla_event.twig',

    CUSTOMER_TRANSFER_CREATED_SENDER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_TRANSFER_CREATED_SENDER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_TRANSFER_CREATED_RECEIVER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_TRANSFER_CREATED_RECEIVER_HTML = 'html/dwolla_event.twig',
    RECURRING_PAYMENT_SCHEDULED_TEXT = 'text/dwolla_event.twig',
    RECURRING_PAYMENT_SCHEDULED_HTML = 'html/dwolla_event.twig',
    RECURRING_PAYMENT_CANCELLED_TEXT = 'text/dwolla_event.twig',
    RECURRING_PAYMENT_CANCELLED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_TRANSFER_CANCELLED_SENDER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_TRANSFER_CANCELLED_SENDER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_TRANSFER_CANCELLED_RECEIVER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_TRANSFER_CANCELLED_RECEIVER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_TRANSFER_FAILED_SENDER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_TRANSFER_FAILED_SENDER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_TRANSFER_FAILED_RECEIVER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_TRANSFER_FAILED_RECEIVER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_TRANSFER_COMPLETED_SENDER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_TRANSFER_COMPLETED_SENDER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_TRANSFER_COMPLETED_RECEIVER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_TRANSFER_COMPLETED_RECEIVER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_CREATED_SENDER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_CREATED_SENDER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_CANCELLED_SENDER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_CANCELLED_SENDER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_CANCELLED_RECEIVER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_CANCELLED_RECEIVER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_FAILED_SENDER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_FAILED_SENDER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_HTML = 'html/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_HTML = 'html/dwolla_event.twig',

    CUSTOMER_FUNDING_SOURCE_ADDED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_FUNDING_SOURCE_ADDED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_FUNDING_SOURCE_REMOVED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_FUNDING_SOURCE_REMOVED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_FUNDING_SOURCE_VERIFIED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_FUNDING_SOURCE_VERIFIED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_MICRODEPOSITS_INITIATED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_MICRODEPOSITS_INITIATED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_MICRODEPOSITS_COMPLETED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_MICRODEPOSITS_COMPLETED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_MICRODEPOSITS_FAILED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_MICRODEPOSITS_FAILED_HTML = 'html/dwolla_event.twig',

    CUSTOMER_CREATED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_CREATED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_VERIFIED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_VERIFIED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_SUSPENDED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_SUSPENDED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_NEEDED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_NEEDED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_UPLOADED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_UPLOADED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_APPROVED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_APPROVED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_FAILED_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_FAILED_HTML = 'html/dwolla_event.twig',
    CUSTOMER_VERIFICATION_RETRY_TEXT = 'text/dwolla_event.twig',
    CUSTOMER_VERIFICATION_RETRY_HTML = 'html/dwolla_event.twig',
}