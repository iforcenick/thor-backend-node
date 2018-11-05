import {Errors, PATCH, Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import {UserService} from '../user/service';
import * as models from './models';
import {User} from '../user/models';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';

@Path('/auth')
export class AuthController extends BaseController {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private service: UserService;

    @Security('api_key')
    @PATCH
    @Path('/password')
    @Tags('auth')
    async changePassword(data: models.PasswordRequest) {
        this.service.setRequestContext(this.getRequestContext());

        const parsedData = await this.validate(data, models.passwordRequestSchema);
        const oldPassword = parsedData['oldPassword'];
        const newPassword = parsedData['newPassword'];
        const confirmPassword = parsedData['confirmPassword'];
        const user = await this.service.get(this.getRequestContext().getUser().id);

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
    @Tags('auth')
    async login(data: models.LoginRequest): Promise<models.AuthUserResponse> {
        this.service.setRequestContext(this.getRequestContext());

        await this.validate(data, models.loginRequestSchema);
        let user;

        try {
            user = await this.service.authenticate(data.login, data.password, data.tenant);
        } catch (err) {
            this.logger.error(err.message);
            throw new Errors.UnauthorizedError();
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
