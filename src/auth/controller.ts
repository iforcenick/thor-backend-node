import {Errors, PATCH, Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import {UserService} from '../user/service';
import * as models from './models';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import {UserAuthorization} from './logic';

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
        const parsedData: models.LoginRequest = await this.validate(data, models.loginRequestSchema);
        const logic = new UserAuthorization(this.getRequestContext());
        const user = await logic.execute(parsedData.login, parsedData.password);

        const mapped = this.map(models.AuthUserResponse, user);
        mapped.token = await this.service.generateJwt(user);
        return mapped;
    }
}
