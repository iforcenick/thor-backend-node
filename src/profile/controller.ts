import {Errors, GET, Path, PathParam, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {transaction} from 'objection';
import {ProfileService} from './service';


@Path('/profile')
export class ProfileController extends BaseController {
    @Inject private logger: Logger;
    @Inject private service: ProfileService;

    @GET
    @Path(':id')
    async getProfile(@PathParam('id') id: string): Promise<models.ProfileResponse> {
        const profile = await this.service.get(id);
        if (!profile) {
            throw new Errors.NotFoundError;
        }

        return this.map(models.ProfileResponse, profile);
    }

    @POST
    @Path('')
    async createProfile(data: models.ProfileRequest): Promise<models.ProfileResponse> {
        const parsedData = await this.validate(data, models.profileRequestSchema);
        let profile = models.Profile.fromJson(parsedData);
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
