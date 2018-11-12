import {Container} from 'typescript-ioc';
import * as dwolla from '../../dwolla';

const client: dwolla.Client = Container.get(dwolla.Client);

const certify = async (uri) => {
    try {
        const result = await client.certifyBusinessVerifiedBeneficialOwnership(uri);
        console.log(result);
    } catch (e) {
        console.log(e);
    }
};

const id = process.argv.slice(2)[0];

if (!id) {
    console.log('Provide BVC id');
    process.exit(1);
}

const uri = `customers/${id}`;
certify(uri).then();