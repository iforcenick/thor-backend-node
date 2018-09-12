import * as dwolla from 'dwolla-v2';
import * as customer from './customer';
import * as funding from './funding';
import * as transaction from './transfer';
import {Logger} from '../logger';
import {Config} from '../config';
import {AutoWired, Inject} from 'typescript-ioc';

@AutoWired
export class Client {
    @Inject private config: Config;
    @Inject private logger: Logger;
    private key: string;
    private secret: string;
    private environment: string;
    private _client: any;
    private client: any;
    private authorized: boolean;

    constructor() {
        this.key = this.config.get('dwolla.key');
        this.secret = this.config.get('dwolla.secret');
        this.environment = this.config.get('dwolla.environment');
        this._client = new dwolla.Client({
            key: this.key,
            secret: this.secret,
            environment: this.environment,
        });
    }

    public async authorize(): Promise<any> {
        if (!this.authorized) {
            this.client = await this._client.auth.client();
            this.authorized = true;
        }
    }

    public async getRoot(): Promise<any> {
        return await this.client.get('/');
    }

    public async createCustomer(_customer: customer.ICustomer): Promise<string> {
        const response = await this.client.post('customers', _customer);
        return response.headers.get('location');
    }

    public async getCustomer(localization: string): Promise<customer.ICustomer> {
        const response = await this.client.get(localization);
        return customer.factory(response.body).setLocalization(localization);
    }

    public async createFundingSource(localization, routing, account, accountType, name: string): Promise<string> {
        const response = await this.client.post(`${localization}/funding-sources`, {
            routingNumber: routing,
            accountNumber: account,
            bankAccountType: accountType,
            name,
        });
        return response.headers.get('location');
    }

    public async createPlaidFundingSource(localization, plaidToken, accountName: string): Promise<string> {
        const response = await this.client.post(`${localization}/funding-sources`, {
            plaidToken,
            name: accountName,
        });
        return response.headers.get('location');
    }

    public async listFundingSource(localization: string): Promise<any> {
        const response = await this.client.get(`${localization}/funding-sources`);
        const sources = [];

        for (const source of response.body._embedded['funding-sources']) {
            sources.push(funding.factory(source));
        }

        return sources;
    }

    public async getFundingSource(localization: string): Promise<funding.ISource> {
        const response = await this.client.get(localization);
        return funding.factory(response.body).setLocalization(localization);
    }

    public async createTransfer(trans: transaction.ITransfer): Promise<string> {
        const response = await this.client.post('transfers', trans);

        return response.headers.get('location');
    }

    public async getTransfer(localization: string): Promise<transaction.ITransfer> {
        const response = await this.client.get(localization);
        return transaction.factory(response.body).setLocalization(localization);
    }

    public async listEvents(limit, offset: number): Promise<any> {
        return await this.client.get(`events?limit=${limit}&offset=${offset}`);
    }

    public async registerWebhookEndpoint(endpointUrl: string): Promise<string> {
        const response = await this.client.post('webhook-subscriptions', {
            url: endpointUrl,
            secret: this.config.get('dwolla.webhookSecret'),
        });
        return response.headers.get('location');
    }

    public async deleteWebhookEndpoint(webhookUrl: string): Promise<string> {
        return await this.client.delete(webhookUrl);
    }

    public async listWebhookEndpoints() {
        return await this.client.get('webhook-subscriptions');
    }

    public async unpauseWebhookEndpoint(id: string) {
        return await this.client.post(`webhook-subscriptions/${id}`, {paused: false});
    }

    public async webhooksCleanup() {
        const res = await this.listWebhookEndpoints();
        const unsubscribe = [];
        const endpointUrl = this.config.get('dwolla.webhookUri');
        const subscriptions = res.body._embedded['webhook-subscriptions'];
        let hasSubscription = false;

        subscriptions.forEach(s => {
            this.logger.info('[dwolla] Enpoint: ', s.url);

            if (s.url !== endpointUrl) {
                unsubscribe.push(this.deleteWebhookEndpoint(s['_links'].self.href));
            } else {
                hasSubscription = true;

                if (s.paused) {
                    this.logger.info('[dwolla] Unpausing webhook: ', s.url);
                    this.unpauseWebhookEndpoint(s.id).then();
                }
            }
        });

        if (unsubscribe.length > 0) {
            this.logger.info('[dwolla] Unsubscribe endpoints count: ', unsubscribe.length);
            const resp = await Promise.all(unsubscribe);
            this.logger.info('[dwolla] Unsubscribe endpoints count response: ', resp);
        }

        if (!hasSubscription) {
            this.logger.info('[dwolla] Register new webhook endpoint');
            const registerRes = await this.registerWebhookEndpoint(endpointUrl);
            this.logger.info('[dwolla] Register new webhook endpoint response: ', registerRes);
        }
    }
}
