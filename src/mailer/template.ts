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
    TRANSFER_FAILED_TEXT = 'transfer_failed_text.twig',
    TRANSFER_FAILED_HTML = 'transfer_failed_html.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_TEXT = 'customer_verification_document_text.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_HTML = 'customer_verification_document_html.twig',
    CUSTOMER_VERIFICATION_RETRY_TEXT = 'customer_verification_retry_text.twig',
    CUSTOMER_VERIFICATION_RETRY_HTML = 'customer_verification_retry_html.twig',
    CUSTOMER_VERIFICATION_SUSPENDED_TEXT = 'customer_verification_suspended_text.twig',
    CUSTOMER_VERIFICATION_SUSPENDED_HTML = 'customer_verification_suspended_html.twig',
    FUNDING_SOURCE_CREATED_TEXT = 'funding_source_created_text.twig',
    FUNDING_SOURCE_CREATED_HTML = 'funding_source_created_html.twig',
    FUNDING_SOURCE_REMOVED_TEXT = 'funding_source_removed_text.twig',
    FUNDING_SOURCE_REMOVED_HTML = 'funding_source_removed_html.twig',
    INVITATION_TEXT = 'invitation_text.twig',
    INVITATION_HTML = 'invitation_html.twig',
    CUSTOMER_TRANSFER_CREATED_SENDER_TEXT = 'text/customer_transfer_created_sender.twig',
    CUSTOMER_TRANSFER_CREATED_SENDER_HTML = 'html/customer_transfer_created_sender.twig',
    CUSTOMER_TRANSFER_CREATED_RECEIVER_TEXT = 'text/customer_transfer_created_receiver.twig',
    CUSTOMER_TRANSFER_CREATED_RECEIVER_HTML = 'html/customer_transfer_created_receiver.twig',
    RECURRING_PAYMENT_SCHEDULED_TEXT = 'text/customer_recurring_payment_scheduled.twig',
    RECURRING_PAYMENT_SCHEDULED_HTML = 'html/customer_recurring_payment_scheduled.twig',
    RECURRING_PAYMENT_CANCELLED_TEXT = 'text/customer_recurring_payment_cancelled.twig',
    RECURRING_PAYMENT_CANCELLED_HTML = 'html/customer_recurring_payment_cancelled.twig',
    CUSTOMER_TRANSFER_CANCELLED_SENDER_TEXT = 'text/customer_transfer_cancelled_sender.twig',
    CUSTOMER_TRANSFER_CANCELLED_SENDER_HTML = 'html/customer_transfer_cancelled_sender.twig',
    CUSTOMER_TRANSFER_CANCELLED_RECEIVER_TEXT = 'text/customer_transfer_cancelled_receiver.twig',
    CUSTOMER_TRANSFER_CANCELLED_RECEIVER_HTML = 'html/customer_transfer_cancelled_receiver.twig',
    CUSTOMER_TRANSFER_FAILED_SENDER_TEXT = 'text/customer_transfer_failed_sender.twig',
    CUSTOMER_TRANSFER_FAILED_SENDER_HTML = 'html/customer_transfer_failed_sender.twig',
    CUSTOMER_TRANSFER_FAILED_RECEIVER_TEXT = 'text/customer_transfer_failed_receiver.twig',
    CUSTOMER_TRANSFER_FAILED_RECEIVER_HTML = 'html/customer_transfer_failed_receiver.twig',
    CUSTOMER_TRANSFER_COMPLETED_SENDER_TEXT = 'text/customer_transfer_completed_sender.twig',
    CUSTOMER_TRANSFER_COMPLETED_SENDER_HTML = 'html/customer_transfer_completed_sender.twig',
    CUSTOMER_TRANSFER_COMPLETED_RECEIVER_TEXT = 'text/customer_transfer_completed_receiver.twig',
    CUSTOMER_TRANSFER_COMPLETED_RECEIVER_HTML = 'html/customer_transfer_completed_receiver.twig',
    CUSTOMER_BANK_TRANSFER_CREATED_SENDER_TEXT = 'text/customer_bank_transfer_created_sender.twig',
    CUSTOMER_BANK_TRANSFER_CREATED_SENDER_HTML = 'html/customer_bank_transfer_created_sender.twig',
    CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_TEXT = 'text/customer_bank_transfer_created_receiver.twig',
    CUSTOMER_BANK_TRANSFER_CREATED_RECEIVER_HTML = 'html/customer_bank_transfer_created_receiver.twig',
    CUSTOMER_BANK_TRANSFER_CANCELLED_SENDER_TEXT = 'text/customer_bank_transfer_cancelled_sender.twig',
    CUSTOMER_BANK_TRANSFER_CANCELLED_SENDER_HTML = 'html/customer_bank_transfer_cancelled_sender.twig',
    CUSTOMER_BANK_TRANSFER_CANCELLED_RECEIVER_TEXT = 'text/customer_bank_transfer_cancelled_receiver.twig',
    CUSTOMER_BANK_TRANSFER_CANCELLED_RECEIVER_HTML = 'html/customer_bank_transfer_cancelled_receiver.twig',
    CUSTOMER_BANK_TRANSFER_FAILED_SENDER_TEXT = 'text/customer_bank_transfer_failed_sender.twig',
    CUSTOMER_BANK_TRANSFER_FAILED_SENDER_HTML = 'html/customer_bank_transfer_failed_sender.twig',
    CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_TEXT = 'text/customer_bank_transfer_failed_receiver.twig',
    CUSTOMER_BANK_TRANSFER_FAILED_RECEIVER_HTML = 'html/customer_bank_transfer_failed_receiver.twig',
    CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_TEXT = 'text/customer_bank_transfer_completed_sender.twig',
    CUSTOMER_BANK_TRANSFER_COMPLETED_SENDER_HTML = 'html/customer_bank_transfer_completed_sender.twig',
    CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_TEXT = 'text/customer_bank_transfer_completed_receiver.twig',
    CUSTOMER_BANK_TRANSFER_COMPLETED_RECEIVER_HTML = 'html/customer_bank_transfer_completed_receiver.twig',
    CUSTOMER_FUNDING_SOURCE_ADDED_TEXT = 'text/customer_funding_source_added.twig',
    CUSTOMER_FUNDING_SOURCE_ADDED_HTML = 'html/customer_funding_source_added.twig',
    CUSTOMER_FUNDING_SOURCE_REMOVED_TEXT = 'text/customer_funding_source_removed.twig',
    CUSTOMER_FUNDING_SOURCE_REMOVED_HTML = 'html/customer_funding_source_removed.twig',
    CUSTOMER_FUNDING_SOURCE_VERIFIED_TEXT = 'text/customer_funding_source_verified.twig',
    CUSTOMER_FUNDING_SOURCE_VERIFIED_HTML = 'html/customer_funding_source_verified.twig',
    CUSTOMER_MICRODEPOSITS_INITIATED_TEXT = 'text/customer_microdeposits_initiated.twig',
    CUSTOMER_MICRODEPOSITS_INITIATED_HTML = 'html/customer_microdeposits_initiated.twig',
    CUSTOMER_MICRODEPOSITS_COMPLETED_TEXT = 'text/customer_microdeposits_completed.twig',
    CUSTOMER_MICRODEPOSITS_COMPLETED_HTML = 'html/customer_microdeposits_completed.twig',
    CUSTOMER_MICRODEPOSITS_FAILED_TEXT = 'text/customer_microdeposits_failed.twig',
    CUSTOMER_MICRODEPOSITS_FAILED_HTML = 'html/customer_microdeposits_failed.twig',
    CUSTOMER_CREATED_TEXT = 'text/customer_created.twig',
    CUSTOMER_CREATED_HTML = 'html/customer_created.twig',
    CUSTOMER_VERIFIED_TEXT = 'text/customer_verified.twig',
    CUSTOMER_VERIFIED_HTML = 'html/customer_verified.twig',
    CUSTOMER_SUSPENDED_TEXT = 'text/customer_suspended.twig',
    CUSTOMER_SUSPENDED_HTML = 'html/customer_suspended.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_NEEDED_TEXT = 'text/customer_verification_document_needed.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_NEEDED_HTML = 'html/customer_verification_document_needed.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_UPLOADED_TEXT = 'text/customer_verification_document_uploaded.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_UPLOADED_HTML = 'html/customer_verification_document_uploaded.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_APPROVED_TEXT = 'text/customer_verification_document_approved.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_APPROVED_HTML = 'html/customer_verification_document_approved.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_FAILED_TEXT = 'text/customer_verification_document_failed.twig',
    CUSTOMER_VERIFICATION_DOCUMENT_FAILED_HTML = 'html/customer_verification_document_failed.twig',

    MISSING_DOCUMENTS_TEXT = 'text/missing_documents.twig',
    MISSING_DOCUMENTS_HTML = 'html/missing_documents.twig',
}