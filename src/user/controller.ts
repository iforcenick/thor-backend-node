import {Errors, GET, Path, PathParam, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import {UserService} from './service';
import * as models from './models';
import * as role from './role';
import {transaction} from 'objection';

@Path('/user')
export class UserController extends BaseController {
    @Inject private logger: Logger;
    private service: UserService;

    constructor(@Inject service: UserService) {
        super();
        this.service = service;
    }

    @GET
    @Path(':id')
    async getUser(@PathParam('id') id: string): Promise<models.UserResponse> {
        const user = await this.service.get(id);

        if (!user) {
            throw new Errors.NotFoundError;
        }

        return this.map(models.UserResponse, user);
    }

    @POST
    @Path('')
    async createUser(data: models.UserRequest): Promise<models.UserResponse> {
        const parsedData = await this.validate(data, models.userRequestSchema);
        let user = models.User.fromJson(parsedData);

        try {
            await transaction(models.User.knex(), async (trx) => {
                user.password = await this.service.hashPassword(user.password);
                const roleEntity = await this.service.getRole(role.models.Types.admin);
                user = await this.service.insert(user, trx);
                await user
                    .$relatedQuery('roles', trx)
                    .relate(roleEntity.id);
            });

            user = await this.service.get(user.id);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.UserResponse, user);
    }
}
