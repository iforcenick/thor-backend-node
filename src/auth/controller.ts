import {Context, ContextRequest, Errors, PATCH, Path, POST, ServiceContext} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import {Logger} from '../logger';
import {UserService} from '../user/service';
import {Config} from '../config';
import * as models from './models';
import {User} from '../user/models';
import {Security} from "typescript-rest-swagger";

@Path('/auth')
export class AuthController extends BaseController {
    @Inject private logger: Logger;
    @Inject private config: Config;
    private service: UserService;

    constructor(@Inject service: UserService) {
        super();
        this.service = service;
    }

    @Security('api_key')
    @PATCH
    @Path('/password')
    async changePassword(@ContextRequest context: ServiceContext, data: PasswordRequest) {
        const parsedData = await this.validate(data, models.passwordRequestSchema);
        const oldPassword = parsedData['oldPassword'];
        const newPassword = parsedData['newPassword'];
        const confirmPassword = parsedData['confirmPassword'];
        const user = await this.service.get(context['user'].id);

        if (newPassword !== confirmPassword) {
            throw new Errors.ConflictError('Passwords do not match');
        }

        try {
            await this.service.changePassword(user, newPassword, oldPassword);
        } catch (e) {
            this.logger.debug(e.message);
            throw new Errors.ConflictError(e.message);
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
