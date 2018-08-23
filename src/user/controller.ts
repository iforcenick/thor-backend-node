import {Errors, GET, Path, PATCH, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import {UserService} from './service';
import * as models from './models';
import {Profile} from '../profile/models';
import {ProfileService} from '../profile/service';
import {transaction} from 'objection';
import {Security} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';

@Security('api_key')
@Path('/users')
export class UserController extends BaseController {
    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;
    private service: UserService;
    private profileService: ProfileService;

    constructor(@Inject service: UserService, @Inject profileService: ProfileService) {
        super();
        this.service = service;
        this.profileService = profileService;
    }

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async getUser(@PathParam('id') id: string): Promise<models.UserResponse> {
        const user = await this.service.get(id);

        if (!user) {
            throw new Errors.NotFoundError();
        }

        return this.map(models.UserResponse, user);
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     */
    @GET
    @Path('')
    async getUserList(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number
    ): Promise<models.PaginatedUserReponse> {
        const users = await this.service.list(page, limit);

        return this.paginate(
            users.pagination,
            users.rows.map(job => {
                return this.map(models.UserResponse, job);
            })
        );
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createUser(data: models.UserRequest): Promise<models.UserResponse> {
        const parsedData = await this.validate(data, models.userRequestSchema);

        let user = models.User.fromJson({});
        user.password = parsedData['password'];
        const profile = Profile.fromJson(parsedData['profile']);

        try {
            await this.dwollaClient.authorize();
            const customer = new dwolla.customer.Customer(dwolla.customer.factoryFromProfile(profile));
            delete profile['ssn'];
            profile.dwollaUri = await this.dwollaClient.createCustomer(customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(profile.dwollaUri);
            profile.dwollaStatus = dwollaCustomer.status;

            user.password = await this.service.hashPassword(user.password);
            user = await this.service.createWithProfile(user, profile);
            user = await this.service.get(user.id);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.UserResponse, user);
    }

    @PATCH
    @Path(':id/profile')
    async patchUser(@PathParam('id') id: string, data: models.UserRequest) {
        const parsedData = await this.validate(data, models.userPatchSchema);
        try {
            await this.service.patch(id, parsedData['profile']);
            return;
        } catch (e) {
            this.logger.error(e);
            throw new Errors.InternalServerError(e);
        }
    }
}
