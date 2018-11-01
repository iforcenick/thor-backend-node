import * as dwolla from 'dwolla-v2';
import * as customer from './customer';
import * as funding from './funding';
import * as transaction from './transfer';
import * as documents from './documents';
import {Logger} from '../logger';
import {Config} from '../config';
import {AutoWired, Inject} from 'typescript-ioc';
import _ from 'lodash';
import {CUSTOMER_STATUS} from './customer';
import {ValidationError} from '../errors';
import {Errors} from 'typescript-rest';

const FormData = require('form-data');

export class DwollaRequestError extends Error {
    private buildPath(path: string, prefix?: string, mapping?: any) {
        const res = prefix ? [prefix] : [];
        const fields = path.slice(1).split('/');

        for (let field of fields) {
            if (mapping && mapping[field]) {
                field = mapping[field];
            }

            res.push(field);
        }

        return res;
    }

    toValidationError(prefix?: string, mapping?: any) {
        let message: any;

        try {
            message = JSON.parse(this.message);
        } catch (e) {
            return new Error(this.message);
        }

        if (!message._embedded) {
            return new Errors.ConflictError(`${message.message}`);
        }

        const errors: any = message._embedded.errors;
        const parsedErrors = [];

        for (const err of errors) {
            const path = this.buildPath(err.path, prefix, mapping);
            const field = path.slice(-1)[0];

            parsedErrors.push({
                message: `"${field}" ${err.message.slice(0, -1)}`,
                path: path,
                type: `external: ${err.code}`,
                context: {value: '', key: field, label: field}
            });
        }

        return new ValidationError({
            details: parsedErrors,
        });
    }
}

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

    private async get(url: string) {
        try {
            return await this.client.get(url);
        } catch (e) {
            throw new DwollaRequestError(e.message);
        }
    }

    private async delete(url: string) {
        try {
            return await this.client.delete(url);
        } catch (e) {
            throw new DwollaRequestError(e.message);
        }
    }

    private async post(url: string, payload: any) {
        try {
            return await this.client.post(url, payload);
        } catch (e) {
            throw new DwollaRequestError(e.message);
        }
    }

    public async getRoot(): Promise<any> {
        return await this.client.get('/');
    }

    public async createCustomer(_customer: customer.ICustomer): Promise<string> {
        const response = await this.post('customers', _customer);
        return response.headers.get('location');
    }

    public async updateCustomer(uri: string, _customer: any) {
        return await this.post(uri, customer.factory(_customer));
    }

    public async getCustomer(localization: string): Promise<customer.ICustomer> {
        const response = await this.get(localization);
        return customer.factory(response.body).setLocalization(localization);
    }

    public async getBusinessVerifiedBeneficialOwner(localization: string): Promise<customer.BeneficialOwner> {
        const response = await this.get(localization);
        return customer.beneficialOwnerFactory(response.body).setLocalization(localization);
    }

    public async createBusinessVerifiedBeneficialOwner(localization: string, owner: customer.BeneficialOwner) {
        const response = await this.post(`${localization}/beneficial-owners`, owner);
        return response.headers.get('location');
    }

    public async editBusinessVerifiedBeneficialOwner(id: string, owner: customer.BeneficialOwner) {
        const response = await this.post(`/beneficial-owners/${id}`, owner);
        return response.headers.get('location');
    }

    public async checkBeneficialOwnerVerificationStatus(id: string, owner: customer.BeneficialOwner) {
        const response = await this.get(`/beneficial-owners/${id}`);
        return response.headers.get('status');
    }

    public async listBusinessVerifiedBeneficialOwners(localization: string) {
        const response = await this.get(`${localization}/beneficial-owners`);
        const owners = [];
        for (const owner of response.body._embedded['beneficial-owners']) {
            owners.push(customer.beneficialOwnerFactory(owner));
        }

        return owners;
    }

    public async createFundingSource(localization, routing, account, accountType, name: string): Promise<string> {
        const response = await this.post(`${localization}/funding-sources`, {
            routingNumber: routing,
            accountNumber: account,
            bankAccountType: accountType,
            name,
        });
        return response.headers.get('location');
    }

    public async deleteFundingSource(localization: string): Promise<string> {
        const response = await this.post(localization, {
            removed: true,
        });
        return response;
    }

    public async createPlaidFundingSource(localization, plaidToken, accountName: string): Promise<string> {
        const response = await this.post(`${localization}/funding-sources`, {
            plaidToken,
            name: accountName,
        });
        return response.headers.get('location');
    }

    public async listFundingSource(localization: string): Promise<any> {
        const response = await this.get(`${localization}/funding-sources`);
        const sources = [];

        for (const source of response.body._embedded['funding-sources']) {
            sources.push(funding.factory(source));
        }

        return sources;
    }

    public async getFundingSource(localization: string): Promise<funding.ISource> {
        const response = await this.get(localization);
        return funding.factory(response.body).setLocalization(localization);
    }

    public async createTransfer(trans: transaction.ITransfer): Promise<string> {
        const response = await this.post('transfers', trans);

        return response.headers.get('location');
    }

    public async cancelTransfer(localization: string): Promise<boolean> {
        const response = await this.post(localization, {status: 'cancelled'});

        return response.body.status == 'cancelled';
    }

    public async getTransfer(localization: string): Promise<transaction.ITransfer> {
        const response = await this.get(localization);
        return transaction.factory(response.body).setLocalization(localization);
    }

    public async listEvents(limit, offset: number): Promise<any> {
        return await this.get(`events?limit=${limit}&offset=${offset}`);
    }

    public async getDocument(localization: string): Promise<documents.IDocument> {
        const response = await this.get(localization);
        return documents.factory(response.body).setLocalization(localization);
    }

    public async listDocuments(localization: string): Promise<Array<documents.IDocument>> {
        const response = await this.get(`${localization}/documents`);
        const _documents = [];

        for (const source of response.body._embedded['documents']) {
            _documents.push(documents.factory(source));
        }

        return _documents;
    }

    public async createDocument(localization: string, data: Buffer, name, type: string): Promise<any> {
        const form = new FormData();
        form.append('file', data, {filename: name});
        form.append('documentType', type);

        const response = await this.post(`${localization}/documents`, form);
        return response.headers.get('location');
    }

    public async registerWebhookEndpoint(endpointUrl: string): Promise<string> {
        const response = await this.post('webhook-subscriptions', {
            url: endpointUrl,
            secret: this.config.get('dwolla.webhookSecret'),
        });
        return response.headers.get('location');
    }

    public async deleteWebhookEndpoint(webhookUrl: string): Promise<string> {
        return await this.delete(webhookUrl);
    }

    public async listWebhookEndpoints() {
        return await this.get('webhook-subscriptions');
    }

    public async unpauseWebhookEndpoint(id: string) {
        return await this.post(`webhook-subscriptions/${id}`, {paused: false});
    }

    public async webhooksCleanup() {
        const res = await this.listWebhookEndpoints();
        const unsubscribe = [];
        const endpointUrl = this.config.get('dwolla.webhookUri');
        const subscriptions = res.body._embedded['webhook-subscriptions'];
        let hasSubscription = false;
        // const r = await this.client.get('webhook-subscriptions/babe27ad-5d84-42d3-86b1-a89f51a8ade3/webhooks');

        subscriptions.forEach(s => {
            this.logger.info('[dwolla] Enpoint: ' + s.url);

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

        // if (unsubscribe.length > 0) {
        //     this.logger.info('[dwolla] Unsubscribe endpoints count: ', unsubscribe.length);
        //     const resp = await Promise.all(unsubscribe);
        //     this.logger.info('[dwolla] Unsubscribe endpoints count response: ', resp);
        // }

        if (!hasSubscription) {
            this.logger.info('[dwolla] Register new webhook endpoint: ', endpointUrl);
            const registerRes = await this.registerWebhookEndpoint(endpointUrl);
            this.logger.info('[dwolla] Register new webhook endpoint response: ', registerRes);
        }
    }

    public async getBalanceFundingSource(localization: string): Promise<funding.ISource> {
        const sources = await this.listFundingSource(localization);

        for (const source of sources) {
            if (source.type == 'balance') {
                return source;
            }
        }

        return undefined;
    }

    public async listBusinessClassification(): Promise<any> {
        return (await this.get(`business-classifications`)).body._embedded;
    }
}
