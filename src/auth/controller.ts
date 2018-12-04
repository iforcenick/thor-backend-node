import {Errors, PATCH, Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import {UserService} from '../user/service';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import {UserAuthorization, UserChangePassword} from './logic';
import {AuthUserResponse, LoginRequest, loginRequestSchema, PasswordRequest, passwordRequestSchema} from './dto';

@Path('/auth')
@Tags('auth')
export class AuthController extends BaseController {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private service: UserService;

    @Security('api_key')
    @PATCH
    @Path('/password')
    async changePassword(data: PasswordRequest) {
        const parsedData: PasswordRequest = await this.validate(data, passwordRequestSchema);
        const logic = new UserChangePassword(this.getRequestContext());
        await logic.execute(parsedData.oldPassword, parsedData.newPassword);
    }

    @POST
    @Path('/login')
    async login(data: LoginRequest): Promise<AuthUserResponse> {
        const parsedData: LoginRequest = await this.validate(data, loginRequestSchema);
        const logic = new UserAuthorization(this.getRequestContext());
        const auth = await logic.execute(parsedData.login, parsedData.password);

        return this.map(AuthUserResponse, auth);
    }
}
