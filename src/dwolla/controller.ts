import {Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as dwolla from '../dwolla';
import {event} from './index';
import {IEvent} from './event';

@Path('/dwolla')
export class DwollaController extends BaseController {
    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;

    @POST
    @Path('')
    async createUser(data: IEvent) {
        console.log(JSON.stringify(data, null, 2));
        const eventO = event.factory(data);
        console.log(eventO);
        return;
    }
}
