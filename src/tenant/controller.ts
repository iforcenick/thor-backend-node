import {Errors, GET, Path, PathParam, POST, Preprocessor} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {transaction} from 'objection';
import {TenantService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';
import {Config} from '../config';

@Security('api_key')
@Path('/tenants')
export class TenantController extends BaseController {
    private service: TenantService;
    constructor(@Inject service: TenantService,
                @Inject logger: Logger, @Inject config: Config) {
        super(logger, config);
        this.service = service;
    }

    @GET
    @Path('statistics')
    @Tags('tenants', 'statistics')
    @Preprocessor(BaseController.requireAdmin)
    async getTenantStats(): Promise<models.TenantStatsResponse> {
        const stats = await this.service.getStatistics();
        return this.map(models.TenantStatsResponse, stats);
    }

    @GET
    @Path(':id')
    @Tags('tenants')
    @Preprocessor(BaseController.requireAdmin)
    async getTenant(@PathParam('id') id: string): Promise<models.TenantResponse> {
        const tenant = await this.service.get(id);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        return this.map(models.TenantResponse, tenant);
    }

    @POST
    @Path('')
    @Tags('tenants')
    @Preprocessor(BaseController.requireAdmin)
    async createTenant(data: models.TenantRequest): Promise<models.TenantResponse> {
        const parsedData = await this.validate(data, models.tenantRequestSchema);
        let tenant = models.Tenant.fromJson(parsedData);
        try {
            await transaction(models.Tenant.knex(), async trx => {
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
