import {Errors, PATCH, Path, POST, GET, PathParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import {UserService} from '../user/service';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import {UserAuthorization, UserChangePassword} from './logic';
import {
    AuthUserResponse,
    LoginRequest,
    loginRequestSchema,
    PasswordRequest,
    passwordRequestSchema,
    ResetPasswordRequest,
    resetPasswordRequestSchema,
} from './dto';
import {ResetPasswordLogic, GetPasswordResetLogic} from '../user/logic';

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

    @POST
    @Path('/resetPassword')
    async resetPassword(data: ResetPasswordRequest): Promise<any> {
        const parsedData: ResetPasswordRequest = await this.validate(data, resetPasswordRequestSchema);
        const logic = new ResetPasswordLogic(this.getRequestContext());
        await logic.execute(parsedData.resetToken, parsedData.newPassword);
    }

    @GET
    @Path('/resetPassword/:resetToken')
    async getPasswordResetToken(@PathParam('resetToken') resetToken: string): Promise<any> {
        const logic = new GetPasswordResetLogic(this.getRequestContext());
        await logic.execute(resetToken);
    }
}
