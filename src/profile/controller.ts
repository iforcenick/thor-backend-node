import {GET, Path, PathParam, PATCH, Preprocessor} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import { UpdateProfileLogic, GetProfileLogic } from './logic';
import {ProfileResponse, ProfileRequest, profilePatchSchema} from './models';

@Security('api_key')
@Path('/profiles')
@Tags('profiles')
export class ProfileController extends BaseController {
    /**
     * Update an admin's profile
     *
     * @param {AdminRequest} data
     * @returns {Promise<ProfileResponse>}
     * @memberof ProfileController
     */
    @PATCH
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async updateProfile(data: ProfileRequest): Promise<ProfileResponse> {
        const parsedData = await this.validate(data, profilePatchSchema);
        const logic = new UpdateProfileLogic(this.getRequestContext());
        const profile = await logic.execute(parsedData);

        return this.map(ProfileResponse, profile);
    }

    /**
     * Get the current user's profile
     *
     * @param {string} id
     * @returns {Promise<ProfileResponse>}
     * @memberof ProfileController
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getProfile(): Promise<ProfileResponse> {
        const logic = new GetProfileLogic(this.getRequestContext());
        const profile = await logic.execute();

        return this.map(ProfileResponse, profile);
    }
}
