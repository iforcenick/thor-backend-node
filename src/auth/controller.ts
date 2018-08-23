import {Context, ContextRequest, Errors, Path, POST, ServiceContext} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import {Logger} from '../logger';
import {UserService} from '../user/service';
import {Config} from '../config';
import * as models from './models';
import {User} from '../user/models';

@Path('/auth')
export class AuthController extends BaseController {
    @Inject private logger: Logger;
    @Inject private config: Config;
    private service: UserService;

    constructor(@Inject service: UserService) {
        super();
        this.service = service;
    }

    @POST
    @Path('/password')
    async changePassword(@ContextRequest context: ServiceContext, data: PasswordRequest) {
        const parsedData = await this.validate(data, models.passwordRequestSchema);
        const {oldPassword, newPassword, confirmPassword} = parsedData;
        const user: User = context['user'];
        if (newPassword !== confirmPassword) {
            throw new Errors.BadRequestError('Passwords does not match');
        }
        try {
            await user.changePassword(newPassword, oldPassword);
        } catch (e) {
            this.logger.debug(e.message);
            throw new Errors.UnauthorizedError();
        }
        return;
    }
    @POST
    @Path('/login')
    async login(data: LoginRequest): Promise<models.AuthUserResponse> {
        await this.validate(data, models.loginRequestSchema);
        let user;

        try {
            user = await this.service.authenticate(data.login, data.password, data.tenant);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err);
        }

        if (!user) {
            this.logger.debug('User ' + data.login + ' not found');
            throw new Errors.UnauthorizedError();
        }
        const mapped = this.map(models.AuthUserResponse, user);
        // const mapped = {};
        mapped.token = await this.service.generateJwt(user);
        return mapped;
    }
}

export interface LoginRequest {
    login: string;
    password: string;
    tenant: string;
}

export interface PasswordRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}
