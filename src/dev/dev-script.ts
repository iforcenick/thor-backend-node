import {Container} from 'typescript-ioc';
import * as dwolla from '../dwolla';

const client: dwolla.Client = Container.get(dwolla.Client);
const customerId = 'f1a19d24-55c5-4819-8378-b6b8f5a4a040';
const baseUrl = 'https://api-sandbox.dwolla.com/';
const customersUrl = baseUrl + 'customers/';
const transfersUrl = baseUrl + 'transfers/';
const fundingSources = baseUrl + 'funding-sources/';

const createTransfer = async (from, to, amount) => {
    await client.authorize();


    console.log(await client.getFundingSource(from));
    try {
        const transfer = dwolla.transfer.factory({});
        transfer.setSource(from);
        transfer.setDestination(to);
        transfer.setAmount(amount);
        transfer.setCurrency('USD');
        const result = await client.createTransfer(transfer);
        //const iTransfer = await client.getTransfer(result);

        //console.log(iTransfer);


    } catch (e) {

        console.log(e);
    }
};
const from = process.argv.slice(2)[0];
const amount = process.argv.slice(2)[1];
console.log(from);
console.log(amount);
createTransfer(from, 'https://api-sandbox.dwolla.com/funding-sources/24a53f09-99ae-420d-8adc-2793845714b6', amount).then();
//createTransfer('https://api-sandbox.dwolla.com/funding-sources/24a53f09-99ae-420d-8adc-2793845714b6', from, amount).then();
