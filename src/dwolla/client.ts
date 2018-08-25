import * as dwolla from 'dwolla-v2';
import * as customer from './customer';
import * as funding from './funding';
import * as transaction from './transfer';
import {Config} from '../config';
import {AutoWired, Inject} from 'typescript-ioc';

@AutoWired
export class Client {
    @Inject private config: Config;
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

    public async listEvents(): Promise<any> {
        return await this.client.get('events');
    }

    public async registerWebhookEndpoint(endpointUrl: string): Promise<string> {
        const response = await this.client.post('webhook-subscriptions', {
            url: endpointUrl,
            secret: this.config.get('dwolla.webhookSecret'),
        });
        return response.headers.get('location');
    }
}
