import {GET, Path, PathParam, PATCH, Preprocessor} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import {UpdateProfileLogic, GetProfileLogic} from './logic';
import {ProfileResponse, ProfileRequest, profilePatchSchema} from './models';

@Security('api_key')
@Path('/profiles')
@Tags('profiles')
export class ProfileController extends BaseController {
    /**
     * Update my profile
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
        const profile = await logic.execute(profileData);

        return this.map(ProfileResponse, profile);
    }

    /**
     * Get my profile
     *
     * @returns {Promise<ProfileResponse>}
     * @memberof ProfileController
     */
    @GET
    @Path('')
    async getProfile(): Promise<ProfileResponse> {
        const logic = new GetProfileLogic(this.getRequestContext());
        const profile = await logic.execute();

        return this.map(ProfileResponse, profile);
    }
}
