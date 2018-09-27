import {Container} from 'typescript-ioc';
import * as dwolla from '../dwolla';

const client: dwolla.Client = Container.get(dwolla.Client);
const customerId = 'f1a19d24-55c5-4819-8378-b6b8f5a4a040';

const listDocuments = async (id) => {
    await client.authorize();
    try {
        const docs = await client.listDocuments('https://api-sandbox.dwolla.com/customers/' + id);
        console.log(docs);
    } catch (e) {
        console.log(e);
    }
};

const listFundingSources = async (id) => {
    await client.authorize();
    try {
        const sources = await client.listFundingSource('https://api-sandbox.dwolla.com/customers/' + id);
        console.log(sources);
    } catch (e) {
        console.log(e);
    }
};

const getBalanceSource = async (id) => {
    await client.authorize();
    try {
        const source = await client.getBalanceFundingSource('https://api-sandbox.dwolla.com/customers/' + id);
        console.log(source);
    } catch (e) {
        console.log(e);
    }
};

const getFundingSource = async (id) => {
    await client.authorize();
    try {
        const source = await client.getFundingSource('https://api-sandbox.dwolla.com/funding-sources/' + id);
        console.log(source);
    } catch (e) {
        console.log(e);
    }
};

const cancelTransfer = async (id) => {
    await client.authorize();
    try {
        await client.getTransfer('https://api-sandbox.dwolla.com/transfers/' + id);
        const source = await client.cancelTransfer('https://api-sandbox.dwolla.com/transfers/' + id);
        console.log(source);
    } catch (e) {
        console.log(e);
    }
};

// listDocuments(customerId).then();
// listFundingSources(customerId).then();
// getBalanceSource(customerId).then();
// getFundingSource('9256ce01-21f4-4b4f-b9b5-6562518c0713').then();
cancelTransfer('932ac2ec-58c2-e811-8110-d08b405a9c82').then();
