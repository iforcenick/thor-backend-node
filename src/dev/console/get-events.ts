import {Container} from 'typescript-ioc';
import * as dwolla from '../../dwolla';
import {Logger} from '../../logger';

const client: dwolla.Client = Container.get(dwolla.Client);

const getEvents = async (limit, offset) => {
    const result = await client.listEvents(limit, 0);

    for (let event of result.body._embedded.events) {
        console.log(JSON.stringify(event, null, 2));
    }
};
const limit = process.argv.slice(2)[0];
const offset = process.argv.slice(2)[1];


getEvents(limit, offset).then();