import {Errors, Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import * as dwolla from '../dwolla';
import {event} from './index';
import {IEvent} from './event';
import {Tags} from 'typescript-rest-swagger';
import {TransactionService} from '../transaction/service';
import {UpdateTransactionStatusLogic} from '../transaction/logic';
import {EventFactory} from '../webhooks/logic';
import {Config} from '../config';

@Tags('dwolla')
@Path('/dwolla/events')
export class DwollaController extends BaseController {

    @Inject config: Config;

    @POST
    @Path('')
    async events(data: IEvent) {
        try {
            const _event = event.factory(data);
            this.logger.info('Dwolla event: ' + JSON.stringify(_event, null, 2));

            this.getRequestContext().setForceTenantId(this.config.get('dwolla.tenantId'));

            const eventLogic = EventFactory.get(_event, this.getRequestContext());
            await eventLogic.execute(_event);
        } catch (e) {
            this.logger.error(e.message);
            throw e;
        }
    }
}
