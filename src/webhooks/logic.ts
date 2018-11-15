import {Inject} from 'typescript-ioc';
import * as dwolla from '../dwolla';
import {Logger} from '../logger';
import {IEvent} from '../dwolla/event';
import {ContractorDocumentEventLogic} from '../contractor/logic';
import {Logic} from '../logic';
import {RequestContext} from '../context';
import {UpdateTransactionStatusLogic} from '../transaction/logic';


export class EventFactory {
    @Inject static logger: Logger;

    static get(event: IEvent, context: RequestContext): Logic {
        switch (event.topic) {
            case dwolla.event.TYPE.customer.created:
                this.logger.info(event);
                break;
            case dwolla.event.TYPE.customer.verificationDocumentNeeded:
                return new ContractorDocumentEventLogic(context);
            case dwolla.event.TYPE.customerFundingSource.added:
                this.logger.info(event);
                break;
            case dwolla.event.TYPE.transfer.created:
                this.logger.info(event);
                break;
            case dwolla.event.TYPE.transfer.created:
            case dwolla.event.TYPE.transfer.canceled:
            case dwolla.event.TYPE.transfer.failed:
            case dwolla.event.TYPE.transfer.reclaimed:
            case dwolla.event.TYPE.transfer.completed:
                return new UpdateTransactionStatusLogic(context);
            default:
                this.logger.warn(`Received unrecognized event eventTopic:'${event.topic} eventId:${event.id}' eventResourceId: ${event.resourceId}`);
                break;
        }
    }
}