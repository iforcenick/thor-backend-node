import {AutoWired, Inject} from 'typescript-ioc';
import {PaymentClient} from './client';
import * as customers from './customer';
import * as documents from './document';
import * as fundingSources from './fundingSource';
import {MailerService} from '../mailer';
import {User} from '../user/models';
import {Profile} from '../profile/models';
import {Tenant} from '../tenant/models';
import {Transaction} from '../transaction/models';
import {Transfer} from '../transaction/transfer/models';
import * as transfers from './transfer';

@AutoWired
export class SandboxPaymentClient extends PaymentClient {
    @Inject private mailerService: MailerService;

    async authorize(): Promise<any> {}
    async getRoot(): Promise<any> {}
    async webhooksCleanup() {}
    async createCustomer(_customer: customers.ICustomer): Promise<string> {
        return 'paymentsUri';
    }
    async updateCustomer(_uri: string, _customer: any) {
        return 'paymentsUri';
    }
    async getCustomer(_localization: string): Promise<customers.ICustomer> {
        const customer = {
            status: customers.CUSTOMER_STATUS.Verified,
            type: customers.TYPE.Personal,
        };
        return customer as customers.ICustomer;
    }
    async getBusinessVerifiedBeneficialOwner(_localization: string): Promise<customers.BeneficialOwner> {
        const owner = {
            id: 'id',
            verificationStatus: 'verificationStatus',
        };
        return owner as customers.BeneficialOwner;
    }
    async createBusinessVerifiedBeneficialOwner(_localization: string, _owner: customers.BeneficialOwner) {
        return 'paymentsUri';
    }
    async deleteBusinessVerifiedBeneficialOwner(_id: string) {}
    async editBusinessVerifiedBeneficialOwner(_id: string, _owner: customers.BeneficialOwner) {
        return 'paymentsUri';
    }
    async retryBusinessVerifiedBeneficialOwner(_id: string, _owner: customers.BeneficialOwner) {
        return 'paymentsUri';
    }
    async checkBeneficialOwnerVerificationStatus(_id: string, _owner: customers.BeneficialOwner) {
        return customers.BENEFICIAL_OWNER_STATUS.Verified;
    }
    async certifyBusinessVerifiedBeneficialOwnership(_uri: string) {}
    async listBusinessVerifiedBeneficialOwners(_localization: string) {
        return [];
    }
    async getIavToken(_localization: string): Promise<any> {
        return 'sandbox';
    }
    async createFundingSource(
        _localization: any,
        _routing: any,
        _account: any,
        _accountType: any,
        _name: string,
    ): Promise<string> {
        return 'paymentsUri';
    }
    async deleteFundingSource(_localization: string): Promise<any> {}
    async createPlaidFundingSource(_localization: any, _plaidToken: any, _accountName: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
    async listFundingSource(_localization: string): Promise<any> {
        return [];
    }
    async getFundingSource(_localization: string): Promise<fundingSources.ISource> {
        return new fundingSources.Source({
            name: 'name',
            id: 'id',
            status: 'verified',
            type: 'checking',
            bankAccountType: 'checking',
            created: 'created',
            removed: 'removed',
            channels: 'channels',
            bankName: 'bankName',
            fingerprint: 'fingerprint',
            balance: 'balance',
        });
    }
    async createFundingSourceMicroDeposit(_localization: string): Promise<boolean> {
        return true;
    }
    async verifyFundingSourceMicroDeposit(_localization: string, _amount1: any, _amount2: number): Promise<boolean> {
        return true;
    }
    async getBalanceFundingSource(_localization: string): Promise<fundingSources.ISource> {
        return new fundingSources.Source({
            name: 'name',
            id: 'id',
            status: 'verified',
            type: 'checking',
            bankAccountType: 'checking',
            created: 'created',
            removed: 'removed',
            channels: 'channels',
            bankName: 'bankName',
            fingerprint: 'fingerprint',
            balance: 'balance',
        });
    }
    async createTransfer(transfer: transfers.ITransfer): Promise<string> {
        try {
            const user = User.factory({});
            user.baseProfile = Profile.factory({
                firstName: 'Test',
                lastName: 'Contractor',
                email: 'thorodin@mailinator.com',
            });
            const tenant = Tenant.factory({businessName: 'Test Company'});
            const transaction = Transaction.factory({});
            transaction.transfer = Transfer.factory({
                createdAt: new Date(),
            });
            transaction.transfer.value = transfer.amount.value;
            await this.mailerService.sendCustomerTransferCompletedReceiver(user, tenant, transaction);
        } catch (error) {
            this.logger.error(error);
        }
        return 'paymentsUri';
    }
    async cancelTransfer(_localization: string): Promise<boolean> {
        return true;
    }
    async getTransfer(_localization: string): Promise<transfers.ITransfer> {
        return new transfers.Transaction({
            amount: 'amount',
            metadata: 'metadata',
            correlationId: 'correlationId',
            id: 'id',
            localization: 'localization',
            status: 'processed',
        });
    }
    async getDocument(_localization: string): Promise<documents.IDocument> {
        return new documents.Document({
            type: documents.TYPE.other,
            status: 'verified',
            created: 'created',
            failureReason: 'failureReason',
            id: 'id',
        });
    }
    async listDocuments(_localization: string): Promise<documents.IDocument[]> {
        return [];
    }
    async createDocument(_localization: string, _data: Buffer, _name: any, _type: string): Promise<any> {
        return 'paymentsUri';
    }
    async listBusinessClassification(): Promise<any> {
        const retVal = {};
        retVal['business-classifications'][0]['_embedded']['industry-classifications'][0] = {
            id: '9ed3f671-7d6f-11e3-803c-5404a6144203',
            name: 'Contractor Employer',
        };
        return retVal;
    }
    async listEvents(_limit: any, _offset: number): Promise<any> {}
    async getEvents(_limit?: number, _offset?: number) {}
}
