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
    @Path(':id')
    @Tags('tenants')
    @Preprocessor(BaseController.requireAdmin)
    async getTenant(@PathParam('id') id: string): Promise<models.TenantResponse> {
        const tenant = await this.service.get(id);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        const mock = {
            id: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
            company: {
                firstName: 'Super',
                lastName: 'Admin',
                email: 'business_20181022_2@test.com',
                country: 'US',
                city: 'SF',
                state: 'CA',
                postalCode: '55100',
                phone: '1112223334',
                address1: 'string',
                address2: 'string',
                type: 'business',
                status: 'verified',
                businessName: 'TestCorporation 2018-10-22',
                doingBusinessAs: 'TestCorporation 2018-10-22',
                website: '',
            }
        };

        return this.map(models.TenantResponse, mock);
    }

    @GET
    @Path(':id/owner')
    @Tags('tenants')
    @Preprocessor(BaseController.requireAdmin)
    async getTenantOwner(@PathParam('id') id: string): Promise<models.TenantOwnerResponse> {
        const tenant = await this.service.get(id);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        const mock = {
            firstName: 'string',
            lastName: 'string',
            title: 'string',
            address: {
                address1: 'string',
                address2: 'string',
                city: 'SF',
                stateProvinceRegion: 'CA',
                postalCode: '55555',
                country: 'US'
            }
        };

        return this.map(models.TenantOwnerResponse, mock);
    }

    @POST
    @Path('')
    @Tags('tenants')
    @Preprocessor(BaseController.requireAdmin)
    async createTenant(data: models.TenantRequest): Promise<models.TenantResponse> {
        const parsedData = await this.validate(data, models.tenantRequestSchema);
        let tenant = models.Tenant.factory(parsedData);
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
