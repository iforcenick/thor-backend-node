import {Errors, GET, PATCH, Path, PathParam, POST, Preprocessor} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {transaction} from 'objection';
import {TenantService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';
import {Config} from '../config';
import * as dwolla from '../dwolla';
import * as context from '../context';
import {DwollaNotifier} from '../dwolla/notifier';
import {UserService} from '../user/service';

@Security('api_key')
@Path('/tenants')
@Tags('tenants')
export class TenantController extends BaseController {
    private service: TenantService;
    private dwollaClient: dwolla.Client;
    private userContext: context.UserContext;
    private tenantContext: context.TenantContext;
    private dwollaNotifier: DwollaNotifier;
    private userService: UserService;

    constructor(@Inject service: TenantService,
                @Inject logger: Logger, @Inject config: Config,
                @Inject userContext: context.UserContext,
                @Inject tenantContext: context.TenantContext,
                @Inject userService: UserService,
                @Inject dwollaClient: dwolla.Client,
                @Inject dwollaNotifier: DwollaNotifier) {
        super(logger, config);
        this.service = service;
        this.userContext = userContext;
        this.tenantContext = tenantContext;
        this.dwollaClient = dwollaClient;
        this.dwollaNotifier = dwollaNotifier;
        this.userService = userService;
    }

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async getTenant(@PathParam('id') id: string): Promise<models.TenantResponse> {
        const tenant = await this.service.get(id);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        return this.map(models.TenantResponse, tenant);
    }

    @GET
    @Path(':id/owner')
    @Preprocessor(BaseController.requireAdmin)
    async getTenantOwner(@PathParam('id') id: string): Promise<models.TenantOwnerResponse> {
        const tenant = await this.service.get(id);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        let customer;
        try {
            await this.dwollaClient.authorize();
            customer = await this.dwollaClient.getCustomer(tenant.dwollaUri);
        } catch (e) {
            this.logger.error(e.message);
            throw new Errors.NotFoundError('Owner data not found');
        }

        return this.map(models.TenantOwnerResponse, customer.controller);
    }

    @POST
    @Path('')
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

    @PATCH
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async updateTenantCompany(data: models.TenantCompanyPatchRequest): Promise<models.TenantResponse> {
        const tenant: models.Tenant = await this.service.get(this.tenantContext.get());
        const parsedData: models.TenantCompanyPatchRequest = await this.validate(data, models.tenantCompanyRequestSchema);

        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        try {
            await this.dwollaClient.authorize();
            const customer = dwolla.customer.factory(parsedData.company);
            customer.type = dwolla.customer.TYPE.Business;

            if (customer.businessType == dwolla.customer.BUSINESS_TYPE.Sole) {
                customer.controller = undefined;
            }

            if (tenant.dwollaUri) {
                await this.dwollaClient.updateCustomer(tenant.dwollaUri, customer.updateableFields());
            } else {
                tenant.dwollaUri = await this.dwollaClient.createCustomer(customer);
            }

            const dwollaCustomer = await this.dwollaClient.getCustomer(tenant.dwollaUri);
            tenant.dwollaStatus = dwollaCustomer.status;
            tenant.dwollaType = dwollaCustomer.type;
            tenant.merge(parsedData.company);

            await this.service.update(tenant);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError('company');
            }
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.TenantResponse, tenant);
    }
}
