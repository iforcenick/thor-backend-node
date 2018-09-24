import {Container} from 'typescript-ioc';
import * as dwolla from '../dwolla';

const client: dwolla.Client = Container.get(dwolla.Client);
const id = 'b77b9223-f515-43c3-8dd8-fcddc073462b';

client.authorize().then(() => {
    client.listDocuments('https://api-sandbox.dwolla.com/customers/' + id).then((docs) => {
        console.log(docs);
    }).catch((err) => {
        console.log(err);
    });
});