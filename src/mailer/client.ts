import {Inject} from 'typescript-ioc';
import {Config} from '../config';
import {Logger} from '../logger';

export interface IClient {
    send(to, from, subject, html, text: string): Promise<boolean>;
}

export abstract class Client implements IClient {
    @Inject protected config: Config;
    @Inject protected logger: Logger;

    async abstract send(to, from, subject, html, text: string): Promise<boolean>;
}

export class MailerClientError extends Error {}