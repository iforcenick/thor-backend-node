import {Errors, Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as dwolla from '../dwolla';
import {event} from './index';
import {IEvent} from './event';
import {Tags} from 'typescript-rest-swagger';
import {TransactionService} from '../transaction/service';

@Tags('dwolla')
@Path('/dwolla/events')
export class DwollaController extends BaseController {
    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;
    private transactionService: TransactionService;

    constructor(@Inject transactionService: TransactionService) {
        super();
        this.transactionService = transactionService;
    }

    @POST
    @Path('')
    async events(data: IEvent) {
        const _event = event.factory(data);
        await this.dwollaClient.authorize();

        switch (_event.topic) {
            case event.TYPE.transferCanceled:
            case event.TYPE.transferCreated:
            case event.TYPE.transferFailed:
            case event.TYPE.transferReclaimed:
            case event.TYPE.transferCompleted: {
                this.logger.info(_event);

                const transfer = await this.transactionService.transferService.getByExternalId(_event._links['resource']['href']);
                if (!transfer) {
                    throw new Errors.NotFoundError('Transfer not found');
                }

                const transaction = await this.transactionService.getByTransferId(transfer.id);
                await this.transactionService.updateTransactionStatus(transaction, _event.topic);
                break;
            }
        }
    }
}
