import {Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as dwolla from '../dwolla';
import {event} from './index';
import {IEvent} from './event';
import {TransferService} from '../transaction/transfer/service';

@Path('/dwolla')
export class DwollaController extends BaseController {
    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private transferService: TransferService;

    @POST
    @Path('')
    async createUser(data: IEvent) {
        const eventO = event.factory(data);
        console.log(eventO);
        switch (eventO.topic) {
            case event.TYPE.transferCompleted: {
                await this.transferService.updateStatus(eventO._links['resource']['href'], eventO.topic);
            }
        }
        return;
    }
}
