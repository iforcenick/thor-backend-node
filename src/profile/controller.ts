import {Errors, GET, Path, PathParam, POST, Preprocessor} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {transaction} from 'objection';
import {ProfileService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';

@Security('api_key')
@Path('/profiles')
@Tags('profiles')
export class ProfileController extends BaseController {
    @Inject private service: ProfileService;

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdminReader)
    async getProfile(@PathParam('id') id: string): Promise<models.ProfileResponse> {
        this.service.setRequestContext(this.getRequestContext());
        const profile = await this.service.get(id);
        if (!profile) {
            throw new Errors.NotFoundError;
        }

        return this.map(models.ProfileResponse, profile);
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createProfile(data: models.ProfileRequest): Promise<models.ProfileResponse> {
        this.service.setRequestContext(this.getRequestContext());
        const parsedData = await this.validate(data, models.profileRequestSchema);
        let profile = models.Profile.factory(parsedData);
        try {
            await transaction(models.Profile.knex(), async (trx) => {
                profile = await this.service.insert(profile, trx);
            });
            profile = await this.service.get(profile.id);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.ProfileResponse, profile);
    }
}
