import {PATCH, Path, POST, GET, PathParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import {UserAuthorizationLogic, UserChangePasswordLogic, RegisterUserLogic} from './logic';
import {
    AuthUserResponse,
    LoginRequest,
    loginRequestSchema,
    ChangePasswordRequest,
    passwordRequestSchema,
    ResetPasswordRequest,
    resetPasswordRequestSchema,
    RegisterUserRequest,
    registerUserRequestSchema,
} from './dto';
import {ResetPasswordLogic, GetPasswordResetLogic} from '../user/logic';

@Path('/auth')
@Tags('auth')
export class AuthController extends BaseController {
    /**
     * Change your password
     *
     * @param {ChangePasswordRequest} data
     * @memberof AuthController
     */
    @PATCH
    @Security('api_key')
    @Path('/password')
    async changePassword(data: ChangePasswordRequest) {
        const parsedData: ChangePasswordRequest = await this.validate(data, passwordRequestSchema);
        const logic = new UserChangePasswordLogic(this.getRequestContext());
        await logic.execute(parsedData.oldPassword, parsedData.newPassword);
    }

    /**
     * Authenticate using login and password
     *
     * @param {LoginRequest} data
     * @returns {Promise<AuthUserResponse>}
     * @memberof AuthController
     */
    @POST
    @Path('/login')
    async login(data: LoginRequest): Promise<AuthUserResponse> {
        const parsedData: LoginRequest = await this.validate(data, loginRequestSchema);
        const logic = new UserAuthorizationLogic(this.getRequestContext());
        const auth = await logic.execute(parsedData.login, parsedData.password);

        return this.map(AuthUserResponse, auth);
    }

    /**
     * Register a new user login using an invitation token
     *
     * @param {RegisterUserRequest} data
     * @returns {Promise<any>}
     * @memberof AuthController
     */
    @POST
    @Path('/register')
    async register(data: RegisterUserRequest): Promise<any> {
        const parsedData: RegisterUserRequest = await this.validate(data, registerUserRequestSchema);
        const logic = new RegisterUserLogic(this.getRequestContext());
        const auth = await logic.execute(parsedData.invitationToken, parsedData.email, parsedData.password);

        return this.map(AuthUserResponse, auth);
    }

    /**
     * Reset your password using a password reset token
     *
     * @param {ResetPasswordRequest} data
     * @returns {Promise<any>}
     * @memberof AuthController
     */
    @POST
    @Path('/resetPassword')
    async resetPassword(data: ResetPasswordRequest): Promise<any> {
        const parsedData: ResetPasswordRequest = await this.validate(data, resetPasswordRequestSchema);
        const logic = new ResetPasswordLogic(this.getRequestContext());
        await logic.execute(parsedData.resetToken, parsedData.newPassword);
    }

    /**
     * Check that a password reset token is valid
     *
     * @param {string} resetToken
     * @returns {Promise<any>}
     * @memberof AuthController
     */
    @GET
    @Path('/resetPassword/:resetToken')
    async getPasswordResetToken(@PathParam('resetToken') resetToken: string): Promise<any> {
        const logic = new GetPasswordResetLogic(this.getRequestContext());
        await logic.execute(resetToken);
    }
}
