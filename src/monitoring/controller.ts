import {GET, Path} from 'typescript-rest';
import {BaseController} from '../api';
import {Tags} from 'typescript-rest-swagger';

@Tags('monitoring')
@Path('/')
export class MonitoringController extends BaseController {
    @GET
    @Path('')
    async health() {
        return {
            running: true,
        };
    }
}
