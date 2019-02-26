import moment = require('moment');
import * as dwolla from 'dwolla-v2';
import {AutoWired, Singleton, Provides} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import {PaymentClient} from './client';
import * as customers from './customer';
import * as documents from './document';
import {ValidationError} from '../errors';
import * as fundingSources from './fundingSource';
import * as transactions from './transfer';

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
                context: {value: '', key: field, label: field},
            });
        }

        return new ValidationError({
            details: parsedErrors,
        });
    }
}

class AuthorizationState {
    authorized: boolean;
    expiration: moment.Moment;

    authorize(expiration) {
        this.authorized = true;
        this.expiration = moment(Date.now()).add(expiration, 'seconds');
    }

    requiresAuthorization() {
        return !this.authorized || !this.expiration || this.expiration.isBefore(Date.now());
    }
}

@AutoWired
@Singleton
@Provides(PaymentClient)
export class DwollaPaymentClient extends PaymentClient {
    private key: string;
    private secret: string;
    private environment: string;
    private _client: any;
    private client: any;
    private authState: AuthorizationState;

    constructor() {
        super();
        this.key = this.config.get('dwolla.key');
        this.secret = this.config.get('dwolla.secret');
        this.environment = this.config.get('dwolla.environment');
        this.authState = new AuthorizationState();
        this._client = new dwolla.Client({
            key: this.key,
            secret: this.secret,
            environment: this.environment,
        });
    }

    async authorize(): Promise<any> {
        if (this.authState.requiresAuthorization()) {
            this.client = await this._client.auth.client();
            this.authState.authorize(this.config.get('dwolla.expirationTime'));
        }
    }

    private async get(url: string) {
        await this.authorize();

        try {
            return await this.client.get(url);
        } catch (e) {
            throw new DwollaRequestError(e.message);
        }
    }

    private async delete(url: string) {
        await this.authorize();

        try {
            return await this.client.delete(url);
        } catch (e) {
            throw new DwollaRequestError(e.message);
        }
    }

    private async post(url: string, payload: any) {
        await this.authorize();

        try {
            return await this.client.post(url, payload);
        } catch (e) {
            throw new DwollaRequestError(e.message);
        }
    }

    private async registerWebhookEndpoint(endpointUrl: string): Promise<string> {
        const response = await this.post('webhook-subscriptions', {
            url: endpointUrl,
            secret: this.config.get('dwolla.webhookSecret'),
        });
        return response.headers.get('location');
    }

    private async deleteWebhookEndpoint(webhookUrl: string): Promise<string> {
        return await this.delete(webhookUrl);
    }

    private async listWebhookEndpoints() {
        return await this.get('webhook-subscriptions');
    }

    private async unpauseWebhookEndpoint(id: string) {
        return await this.post(`webhook-subscriptions/${id}`, {paused: false});
    }

    async getRoot(): Promise<any> {
        return await this.client.get('/');
    }

    async createCustomer(_customer: customers.ICustomer): Promise<string> {
        const response = await this.post('customers', _customer);
        return response.headers.get('location');
    }

    async updateCustomer(uri: string, _customer: any) {
        return await this.post(uri, customers.factory(_customer));
    }

    async getCustomer(localization: string): Promise<customers.ICustomer> {
        const response = await this.get(localization);
        return customers.factory(response.body).setLocalization(localization);
    }

    async getBusinessVerifiedBeneficialOwner(localization: string): Promise<customers.BeneficialOwner> {
        const response = await this.get(localization);
        return customers.beneficialOwnerFactory(response.body).setLocalization(localization);
    }

    async getIavToken(localization: string): Promise<any> {
        const response = await this.post(`${localization}/iav-token`, {});
        return response.body.token;
    }

    async createBusinessVerifiedBeneficialOwner(localization: string, owner: customers.BeneficialOwner) {
        const response = await this.post(`${localization}/beneficial-owners`, owner);
        return response.headers.get('location');
    }

    async deleteBusinessVerifiedBeneficialOwner(id: string) {
        return await this.delete(PaymentClient.beneficialOwnerUri(id));
    }

    async editBusinessVerifiedBeneficialOwner(id: string, owner: customers.BeneficialOwner) {
        const response = await this.post(PaymentClient.beneficialOwnerUri(id), owner);
        return response.headers.get('location');
    }
    async retryBusinessVerifiedBeneficialOwner(id: string, owner: customers.BeneficialOwner) {
        const response = await this.post(PaymentClient.beneficialOwnerUri(id), owner);
        return response.body;
    }

    async checkBeneficialOwnerVerificationStatus(id: string, owner: customers.BeneficialOwner) {
        const response = await this.get(PaymentClient.beneficialOwnerUri(id));
        return response.headers.get('status');
    }

    async certifyBusinessVerifiedBeneficialOwnership(uri: string) {
        const response = await this.post(`${uri}/beneficial-ownership`, {
            status: 'certified',
        });
        return response.body.status;
    }

    async listBusinessVerifiedBeneficialOwners(localization: string) {
        const response = await this.get(`${localization}/beneficial-owners`);
        const owners = [];
        for (const owner of response.body._embedded['beneficial-owners']) {
            owners.push(customers.beneficialOwnerFactory(owner));
        }

        return owners;
    }

    async createFundingSource(localization, routing, account, accountType, name: string): Promise<string> {
        const response = await this.post(`${localization}/funding-sources`, {
            routingNumber: routing,
            accountNumber: account,
            bankAccountType: accountType,
            name,
        });
        return response.headers.get('location');
    }

    async deleteFundingSource(localization: string): Promise<string> {
        return await this.post(localization, {
            removed: true,
        });
    }

    async createPlaidFundingSource(localization, plaidToken, accountName: string): Promise<string> {
        const response = await this.post(`${localization}/funding-sources`, {
            plaidToken,
            name: accountName,
        });
        return response.headers.get('location');
    }

    async listFundingSource(localization: string): Promise<any> {
        const response = await this.get(`${localization}/funding-sources`);
        const sources = [];

        for (const source of response.body._embedded['funding-sources']) {
            sources.push(fundingSources.factory(source));
        }

        return sources;
    }

    async getFundingSource(localization: string): Promise<fundingSources.ISource> {
        const response = await this.get(localization);
        return fundingSources.factory(response.body).setLocalization(localization);
    }

    async createFundingSourceMicroDeposit(localization: string): Promise<boolean> {
        const response = await this.post(`${localization}/micro-deposits`, {});
        return response.status == 201;
    }

    async verifyFundingSourceMicroDeposit(localization: string, amount1, amount2: number): Promise<boolean> {
        const response = await this.post(`${localization}/micro-deposits`, {
            amount1: {
                value: amount1,
                currency: 'USD',
            },
            amount2: {
                value: amount2,
                currency: 'USD',
            },
        });
        return response;
    }

    async createTransfer(trans: transactions.ITransfer): Promise<string> {
        const response = await this.post('transfers', trans);

        return response.headers.get('location');
    }

    async cancelTransfer(localization: string): Promise<boolean> {
        const response = await this.post(localization, {status: 'cancelled'});

        return response.body.status == 'cancelled';
    }

    async getTransfer(localization: string): Promise<transactions.ITransfer> {
        const response = await this.get(localization);
        return transactions.factory(response.body).setLocalization(localization);
    }

    async listEvents(limit, offset: number): Promise<any> {
        return await this.get(`events?limit=${limit}&offset=${offset}`);
    }

    async getDocument(localization: string): Promise<documents.IDocument> {
        const response = await this.get(localization);
        return documents.factory(response.body).setLocalization(localization);
    }

    async listDocuments(localization: string): Promise<Array<documents.IDocument>> {
        const response = await this.get(`${localization}/documents`);
        const _documents = [];

        for (const source of response.body._embedded['documents']) {
            _documents.push(documents.factory(source));
        }

        return _documents;
    }

    async createDocument(localization: string, data: Buffer, name, type: string): Promise<any> {
        const form = new FormData();
        form.append('file', data, {filename: name});
        form.append('documentType', type);

        const response = await this.post(`${localization}/documents`, form);
        return response.headers.get('location');
    }

    async webhooksCleanup() {
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

    async getBalanceFundingSource(localization: string): Promise<fundingSources.ISource> {
        const sources = await this.listFundingSource(localization);

        for (const source of sources) {
            if (source.type == 'balance') {
                return source;
            }
        }

        return undefined;
    }

    async listBusinessClassification(): Promise<any> {
        return (await this.get(`business-classifications`)).body._embedded;
    }

    async getEvents(limit?: number, offset?: number) {
        let eventPath = 'events';
        let params = '';
        if (limit) {
            params += `?limit=${limit}`;
        }
        if (offset) {
            params += `&offset=${offset}`;
        }
        if (params) {
            eventPath += params;
        }

        return await this.get(eventPath);
    }
}
