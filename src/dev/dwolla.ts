import {Container} from 'typescript-ioc';
import * as dwolla from '../dwolla';

const client: dwolla.Client = Container.get(dwolla.Client);
const customerId = 'f1a19d24-55c5-4819-8378-b6b8f5a4a040';
const baseUrl = 'https://api-sandbox.dwolla.com/';
const customersUrl = baseUrl + 'customers/';
const transfersUrl = baseUrl + 'transfers/';
const fundingSources = baseUrl + 'funding-sources/';

const getCustomer = async (id) => {
    await client.authorize();
    try {
        const customer = await client.getCustomer(customersUrl + id);
        console.log(customer);
    } catch (e) {
        console.log(e);
    }
};

const listDocuments = async (id) => {
    await client.authorize();
    try {
        const docs = await client.listDocuments(customersUrl + id);
        console.log(docs);
    } catch (e) {
        console.log(e);
    }
};

const listBusinessVerifiedBeneficialOwners = async (id) => {
    await client.authorize();
    try {
        const docs = await client.listBusinessVerifiedBeneficialOwners(customersUrl + id);
        console.log(docs);
    } catch (e) {
        console.log(e);
    }
};

const createBusinessVerifiedBeneficialOwner = async (id) => {
    await client.authorize();
    try {
        let owner = dwolla.customer.ownerFactory({
            firstName: 'firstName',
            lastName: 'lastName',
            title: 'chief',
            dateOfBirth: '1900-10-10',
            ssn: '123456789',
            address: {
                address1: 'address1',
                address2: 'address2',
                city: 'city',
                stateProvinceRegion: 'stateProvinceRegion',
                postalCode: 'postalCode',
                country: 'US',
            }
        });
        const location = await client.createBusinessVerifiedBeneficialOwner(customersUrl + id, owner);
        owner = await client.getBusinessVerifiedBeneficialOwner(location);
        console.log(owner);
    } catch (e) {
        console.log(e);
    }
};

const listFundingSources = async (id) => {
    await client.authorize();
    try {
        const sources = await client.listFundingSource(customersUrl + id);
        console.log(sources);
    } catch (e) {
        console.log(e);
    }
};

const getBalanceSource = async (id) => {
    await client.authorize();
    try {
        const source = await client.getBalanceFundingSource(customersUrl + id);
        console.log(source);
    } catch (e) {
        console.log(e);
    }
};

const getFundingSource = async (id) => {
    await client.authorize();
    try {
        const source = await client.getFundingSource(fundingSources + id);
        console.log(source);
    } catch (e) {
        console.log(e);
    }
};

const cancelTransfer = async (id) => {
    await client.authorize();
    try {
        await client.getTransfer(transfersUrl + id);
        const source = await client.cancelTransfer(transfersUrl + id);
        console.log(source);
    } catch (e) {
        console.log(e);
    }
};

const listBusinessClassification = async () => {
    await client.authorize();

    try {
        const classifications = await client.listBusinessClassification();
        for (const classification of classifications) {
            console.log(classification.id, classification.name, classification._embedded['industry-classifications']);
        }
    } catch (e) {
        console.log(e);
    }
};

// listDocuments(customerId).then();
// listFundingSources(customerId).then();
// getBalanceSource(customerId).then();
// getFundingSource('9256ce01-21f4-4b4f-b9b5-6562518c0713').then();
// cancelTransfer('932ac2ec-58c2-e811-8110-d08b405a9c82').then();
// listBusinessClassification().then();
getCustomer('d2ed9740-2150-4e2d-8022-e8605ae00d37').then();
// createBusinessVerifiedBeneficialOwner('af839255-d253-41db-ae2c-3db2f579b6a1').then();
// listBusinessVerifiedBeneficialOwners('af839255-d253-41db-ae2c-3db2f579b6a1').then();
