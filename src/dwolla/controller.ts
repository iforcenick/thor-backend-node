import {Errors, Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as dwolla from '../dwolla';
import {event} from './index';
import {IEvent} from './event';
import {TransferService} from '../transaction/transfer/service';
import {Tags} from 'typescript-rest-swagger';

@Tags('dwolla')
@Path('/dwolla/events')
export class DwollaController extends BaseController {
    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private transferService: TransferService;

    constructor(@Inject transferService: TransferService) {
        super();
        this.transferService = transferService;
    }

    @POST
    @Path('')
    async events(data: IEvent) {
        const _event = event.factory(data);
        await this.dwollaClient.authorize();

        switch (_event.topic) {
            case event.TYPE.transferCompleted: {
                const transfer = await this.transferService.getByExternalId(_event._links['resource']['href']);
                if (!transfer) {
                    throw new Errors.NotFoundError('Transfer not found');
                }

                transfer.status = _event.topic;
                await this.transferService.update(transfer);
            }
        }
        return;
    }
}
