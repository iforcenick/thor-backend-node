import { Errors, Path, POST } from 'typescript-rest';
import { BaseController } from '../api';
import { Inject } from 'typescript-ioc';
import { Logger } from '../logger';
import { UserService } from '../user/service';
import { Config } from '../config';
import * as models from './models';

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
    @Path('/login')
    async login(data: LoginRequest): Promise<models.AuthUserResponse> {
        await this.validate(data, models.loginRequestSchema);
        let user;

        try {
            user = await this.service.authenticate(
                data.login,
                data.password,
                data.tenant
            );
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
