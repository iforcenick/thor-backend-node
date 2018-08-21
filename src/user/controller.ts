import {
    Errors,
    GET,
    Path,
    PathParam,
    POST,
    Preprocessor,
} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import {UserService} from './service';
import * as models from './models';
import {Profile} from '../profile/models';
import {ProfileService} from '../profile/service';

@Path('/users')
export class UserController extends BaseController {
    @Inject private logger: Logger;
    private service: UserService;
    private profileService: ProfileService;

    constructor(
        @Inject service: UserService,
        @Inject profileService: ProfileService
    ) {
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
        const {password, ...profileData} = data;
        const userData = {password};
        const parsedUserData = await this.validate(
            userData,
            models.userRequestSchema
        );
        let user = models.User.fromJson(parsedUserData);
        const profile = Profile.fromJson(profileData);
        try {
            user.password = await this.service.hashPassword(user.password);
            user = await this.service.createWithProfile(user, profile);
            await this.profileService.createBaseProfile(
                Profile.fromJson({...profileData, userId: user.id})
            );
            user = await this.service.get(user.id);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.UserResponse, user);
    }
}
