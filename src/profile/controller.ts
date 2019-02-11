import {GET, Path, PATCH, Preprocessor, PathParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import {UserPatchRequest, userPatchSchema} from '../user/dto';
import {UpdateProfileLogic, GetProfileLogic} from './logic';
import {ProfileResponse, ProfileRequest, profilePatchSchema} from './models';

@Security('api_key')
@Path('/profiles')
@Tags('profiles')
export class ProfileController extends BaseController {
    /**
     * Update your profile
     *
     * @param {ProfileRequest} data
     * @returns {Promise<ProfileResponse>}
     * @memberof ProfileController
     */
    @PATCH
    @Path('')
    async updateProfile(data: ProfileRequest): Promise<ProfileResponse> {
        const profileData = await this.validate(data, profilePatchSchema);
        const logic = new UpdateProfileLogic(this.getRequestContext());
        const profile = await logic.execute(this.getRequestContext().getUserId(), profileData);
        return this.map(ProfileResponse, profile);
    }

    /**
     * Get your profile
     *
     * @returns {Promise<ProfileResponse>}
     * @memberof ProfileController
     */
    @GET
    @Path('')
    async getProfile(): Promise<ProfileResponse> {
        const logic = new GetProfileLogic(this.getRequestContext());
        const profile = await logic.execute(this.getRequestContext().getUserId());
        return this.map(ProfileResponse, profile);
    }
}

@Security('api_key')
@Path('/users/:userId/profiles')
@Tags('profiles')
export class UserProfileController extends BaseController {
    /**
     * Get your profile
     *
     * @returns {Promise<ProfileResponse>}
     * @memberof ProfileController
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getUserProfile(@PathParam('userId') userId: string): Promise<ProfileResponse> {
        const logic = new GetProfileLogic(this.getRequestContext());
        const profile = await logic.execute(userId);
        return this.map(ProfileResponse, profile);
    }

    @PATCH
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async updateUserProfile(@PathParam('userId') userId: string, data: UserPatchRequest): Promise<ProfileResponse> {
        const parsedData = await this.validate(data, userPatchSchema);
        const logic = new UpdateProfileLogic(this.getRequestContext());
        const profile = await logic.execute(userId, parsedData['profile']);
        return this.map(ProfileResponse, profile);
    }
}
