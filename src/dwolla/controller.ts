import {
    Errors,
    GET,
    Path,
    PATCH,
    PathParam,
    POST,
    Preprocessor,
    QueryParam,
    ContextRequest,
    ServiceContext,
    DELETE,
    HttpError,
} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import {Profile, ProfileResponse} from '../profile/models';
import {ProfileService} from '../profile/service';
import {transaction} from 'objection';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import {ValidationError} from '../errors';
import {event} from './index';

// @Security('api_key')
@Path('/dwolla')
export class DwollaController extends BaseController {
    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;
    // private service: UserService;
    // private profileService: ProfileService;
    //
    // constructor(@Inject service: UserService, @Inject profileService: ProfileService) {
    //     super();
    //     this.service = service;
    //     this.profileService = profileService;
    // }

    @POST
    @Path('')
    // @Preprocessor(BaseController.requireAdmin)
    // @Tags('users')
    async createUser(data) {
        console.log(JSON.stringify(data, null, 2));
        const eventO = event.factory(data);
        console.log(eventO);
        return;
    }
}
