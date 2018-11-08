import {Container} from 'typescript-ioc';
import * as dwolla from '../../dwolla';
import {Config} from '../../config';

const client: dwolla.Client = Container.get(dwolla.Client);
const config: Config = Container.get(Config);
const masterBalance = config.get('dwolla.masterFunding');
const dwollaUri = 'https://api-sandbox.dwolla.com'; // TODO: get from config

const transfer = async (from, amount) => {
    await client.authorize();

    try {
        await client.getFundingSource(from);
    } catch (e) {
        console.log('Invalid funding source');
        process.exit(1);
    }

    try {
        const transfer = dwolla.transfer.factory({});
        transfer.setSource(from);
        transfer.setDestination(masterBalance);
        transfer.setAmount(amount);
        transfer.setCurrency('USD');
        const result = await client.createTransfer(transfer);
        const dwollaTransfer = await client.getTransfer(result);
        console.log(`Transfer created, amount: ${dwollaTransfer.getAmount()}, status: ${dwollaTransfer.status}, uri: ${dwollaTransfer.localization}`);
    } catch (e) {
        console.log(e);
    }
};
const fromId = process.argv.slice(2)[0];
const amount = Number(process.argv.slice(2)[1]);

if (!fromId) {
    console.log('Provide funding source id');
    process.exit(1);
}

if (!amount) {
    console.log('Provide amount to transfer');
    process.exit(1);
}

const fromUri = `${dwollaUri}/funding-sources/${fromId}`;

transfer(fromUri, amount).then();
