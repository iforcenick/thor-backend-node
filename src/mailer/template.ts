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
    SUMMARY_TEXT = 'summary_text.twig',
    SUMMARY_HTML = 'summary_html.twig',
}