import {Inject, AutoWired} from 'typescript-ioc';
import {Config} from '../config';
import * as customers from './customer';
import * as documents from './document';
import * as fundingSources from './fundingSource';
import {Logger} from '../logger';
import * as transfers from './transfer';

export interface IPaymentClient {
}

@AutoWired
export abstract class PaymentClient implements IPaymentClient {
    @Inject protected config: Config;
    @Inject protected logger: Logger;

    public static beneficialOwnerUri(id) {
        return `/beneficial-owners/${id}`;
    }

    abstract async authorize(): Promise<any>;
    abstract async getRoot(): Promise<any>;
    abstract async createCustomer(_customers: customers.ICustomer): Promise<string>;
    abstract async updateCustomer(uri: string, _customers: any);
    abstract async getCustomer(localization: string): Promise<customers.ICustomer>;
    abstract async getBusinessVerifiedBeneficialOwner(localization: string): Promise<customers.BeneficialOwner>;
    abstract async getIavToken(localization: string): Promise<any>;
    abstract async createBusinessVerifiedBeneficialOwner(localization: string, owner: customers.BeneficialOwner);
    abstract async deleteBusinessVerifiedBeneficialOwner(id: string);
    abstract async editBusinessVerifiedBeneficialOwner(id: string, owner: customers.BeneficialOwner);
    abstract async retryBusinessVerifiedBeneficialOwner(id: string, owner: customers.BeneficialOwner);
    abstract async checkBeneficialOwnerVerificationStatus(id: string, owner: customers.BeneficialOwner);
    abstract async certifyBusinessVerifiedBeneficialOwnership(uri: string);
    abstract async listBusinessVerifiedBeneficialOwners(localization: string);
    abstract async createFundingSource(localization, routing, account, accountType, name: string): Promise<string>;
    abstract async deleteFundingSource(localization: string): Promise<any>;
    abstract async createPlaidFundingSource(localization, plaidToken, accountName: string): Promise<string>;
    abstract async listFundingSource(localization: string): Promise<any>;
    abstract async getFundingSource(localization: string): Promise<fundingSources.ISource>;
    abstract async createFundingSourceMicroDeposit(localization: string): Promise<boolean>;
    abstract async verifyFundingSourceMicroDeposit(localization: string, amount1, amount2: number): Promise<boolean>;
    abstract async createTransfer(trans: transfers.ITransfer): Promise<string>;
    abstract async cancelTransfer(localization: string): Promise<boolean>;
    abstract async getTransfer(localization: string): Promise<transfers.ITransfer>;
    abstract async listEvents(limit, offset: number): Promise<any>;
    abstract async getDocument(localization: string): Promise<documents.IDocument>;
    abstract async listDocuments(localization: string): Promise<Array<documents.IDocument>>;
    abstract async createDocument(localization: string, data: Buffer, name, type: string): Promise<any>;
    abstract async webhooksCleanup();
    abstract async getBalanceFundingSource(localization: string): Promise<fundingSources.ISource>;
    abstract async listBusinessClassification(): Promise<any>;
    abstract async getEvents(limit?: number, offset?: number);
}

export class PaymentClientError extends Error {}
