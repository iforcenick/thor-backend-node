import {Errors, GET, Path, PathParam, POST} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {transaction} from 'objection';
import {TenantService} from './service';


@Path('/tenant')
export class TenantController extends BaseController {
    @Inject private logger: Logger;
    @Inject private service: TenantService;

    @GET
    @Path(':id')
    async getTenant(@PathParam('id') id: string): Promise<models.TenantResponse> {
        const tenant = await this.service.get(id);
        if (!tenant) {
            throw new Errors.NotFoundError;
        }

        return this.map(models.TenantResponse, tenant);
    }

    @POST
    @Path('')
    async createTenant(data: models.TenantRequest): Promise<models.TenantResponse> {
        const parsedData = await this.validate(data, models.tenantRequestSchema);
        let tenant = models.Tenant.fromJson(parsedData);
        try {
            await transaction(models.Tenant.knex(), async (trx) => {
                tenant = await this.service.insert(tenant, trx);
            });
            tenant = await this.service.get(tenant.id);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.TenantResponse, tenant);
    }
}
