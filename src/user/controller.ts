import {Errors, GET, Path, PATCH, PathParam, POST, Preprocessor} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import {UserService} from './service';
import * as models from './models';
import {Profile} from '../profile/models';
import {ProfileService} from '../profile/service';
import {transaction} from 'objection';

@Path('/users')
export class UserController extends BaseController {
    @Inject private logger: Logger;
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

    @GET
    @Path('')
    async getUserList() {
        const users = await this.service.getAll();
        return users;
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
    async patchUser(@PathParam('id') id: string, data) {
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
