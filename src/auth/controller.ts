import {PATCH, Path, POST, GET, PathParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import * as dto from './dto';
import {UserAuthorizationLogic, UserChangePasswordLogic, RegisterUserLogic} from './logic';
import {ResetPasswordLogic, GetPasswordResetLogic} from '../user/logic';

@Path('/auth')
@Tags('auth')
export class AuthController extends BaseController {
    /**
     * Change your password
     *
     * @param {dto.ChangePasswordRequest} data
     * @memberof AuthController
     */
    @PATCH
    @Security('api_key')
    @Path('/password')
    async changePassword(data: dto.ChangePasswordRequest) {
        const parsedData: dto.ChangePasswordRequest = await this.validate(data, dto.passwordRequestSchema);
        const logic = new UserChangePasswordLogic(this.getRequestContext());
        await logic.execute(parsedData.oldPassword, parsedData.newPassword);
    }

    /**
     * Authenticate using login and password
     *
     * @param {dto.LoginRequest} data
     * @returns {Promise<dto.AuthUserResponse>}
     * @memberof AuthController
     */
    @POST
    @Path('/login')
    async login(data: dto.LoginRequest): Promise<dto.AuthUserResponse> {
        const parsedData: dto.LoginRequest = await this.validate(data, dto.loginRequestSchema);
        const logic = new UserAuthorizationLogic(this.getRequestContext());
        const auth = await logic.execute(parsedData.login, parsedData.password);
        return this.map(dto.AuthUserResponse, auth);
    }

    /**
     * Register a new user login using an invitation token
     *
     * @param {dto.RegisterUserRequest} data
     * @returns {Promise<any>}
     * @memberof AuthController
     */
    @POST
    @Path('/register')
    async register(data: dto.RegisterUserRequest): Promise<any> {
        const parsedData: dto.RegisterUserRequest = await this.validate(data, dto.registerUserRequestSchema);
        const logic = new RegisterUserLogic(this.getRequestContext());
        const auth = await logic.execute(parsedData.invitationToken, parsedData.email, parsedData.password);
        return this.map(dto.AuthUserResponse, auth);
    }

    /**
     * Reset your password using a password reset token
     *
     * @param {dto.ResetPasswordRequest} data
     * @returns {Promise<any>}
     * @memberof AuthController
     */
    @POST
    @Path('/resetPassword')
    async resetPassword(data: dto.ResetPasswordRequest): Promise<any> {
        const parsedData: dto.ResetPasswordRequest = await this.validate(data, dto.resetPasswordRequestSchema);
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
