import {GET, Path} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import {Tags} from 'typescript-rest-swagger';

@Tags('monitoring')
@Path('/')
export class MonitoringController extends BaseController {
    @Inject private logger: Logger;

    @GET
    @Path('')
    async health() {
        return {
            running: true,
        };
    }
}
