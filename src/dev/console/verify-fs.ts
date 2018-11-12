import {Container} from 'typescript-ioc';
import * as dwolla from '../../dwolla';

const client: dwolla.Client = Container.get(dwolla.Client);

const verify = async (uri) => {
    try {
        if (await client.createFundingSourceMicroDeposit(uri)) {
            const result = await client.verifyFundingSourceMicroDeposit(uri, 0.01, 0.02);
            console.log(result);
        } else {
            console.log('Could not create micro deposit for funding source');
            process.exit(1);
        }
    } catch (e) {
        console.log(e);
    }
};

const id = process.argv.slice(2)[0];

if (!id) {
    console.log('Provide funding source id');
    process.exit(1);
}

const uri = `funding-sources/${id}`;
verify(uri).then();