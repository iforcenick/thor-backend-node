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
        return await Twig.twig({data: this.text}).render(this.params);
    }

    async getHtml(): Promise<string> {
        return await Twig.twig({data: this.html}).render(this.params);
    }

    async getSubject(): Promise<string> {
        return await Twig.twig({data: this.subject}).render(this.params);
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
}