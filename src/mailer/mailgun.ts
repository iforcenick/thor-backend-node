import * as client from './client';
import {AutoWired, Provides} from 'typescript-ioc';

const MailgunClient = require('mailgun-js');

@AutoWired
@Provides(client.Client)
export class Mailgun extends client.Client {
    private client;

    constructor() {
        super();
        // this.client = new MailgunClient({
        //     apiKey: this.config.get('mailer.mailgun.key'),
        //     domain: this.config.get('mailer.mailgun.domain')
        // });
        this.client = new MailgunClient({
            apiKey: '7a6bfca3ea51a176c6915860175de72b-c1fe131e-16d8cc08',
            domain: 'sandboxe0ca2f8eaed14f5a938c9738a3858206.mailgun.org'
        });
    }

    /* istanbul ignore next */
    private _send(data, callback) {
        this.client.messages().send(data, callback);
    }

    async send(to, from, subject, html, text: string): Promise<boolean> {
        const data = {from, to, subject, text, html};

        try {
            await new Promise((resolve, reject) => {
                this._send(data, (err, body) => {
                    if (err) {
                        reject(err);
                    }

                    this.logger.info('[Mailgun]' + JSON.stringify(body));
                    resolve(body);
                });
            });
        } catch (e) {
            throw new client.MailerClientError(e);
        }

        return true;
    }
}
