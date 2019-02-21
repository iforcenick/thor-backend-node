import {Inject} from 'typescript-ioc';
import {Path, POST} from 'typescript-rest';
import {Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import {Config} from '../config';
import {IEvent} from '../payment/event';
import {EventFactory} from '../webhooks/logic';
import {events} from '../payment';

@Tags('dwolla')
@Path('/dwolla/events')
export class WebhookController extends BaseController {
    @Inject config: Config;

    @POST
    @Path('')
    async events(data: IEvent) {
        try {
            const _event = events.factory(data);
            this.logger.info('Dwolla event: ' + JSON.stringify(_event, null, 2));

            const eventLogic = EventFactory.get(_event, this.getRequestContext());
            if (eventLogic) {
                await eventLogic.execute(_event);
            }
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }
}
