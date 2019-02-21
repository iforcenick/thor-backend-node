import {Container} from 'typescript-ioc';
import {DwollaPaymentClient} from '../../payment/dwolla';

const client: DwollaPaymentClient = Container.get(DwollaPaymentClient);

const getEvents = async (limit, _offset) => {
    const result = await client.listEvents(limit, 0);

    for (const event of result.body._embedded.events) {
        console.log(JSON.stringify(event, null, 2));
    }
};
const limit = process.argv.slice(2)[0];
const offset = process.argv.slice(2)[1];

getEvents(limit, offset).then();
