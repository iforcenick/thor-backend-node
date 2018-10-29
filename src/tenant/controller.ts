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

import {
    BusinessClassificationsResponse,
} from './models';

@Security('api_key')
@Path('/tenants')
@Tags('tenants')
@Preprocessor(BaseController.requireAdmin)
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
    async getTenant(@PathParam('id') id: string): Promise<models.TenantResponse> {
        const tenant = await this.service.get(id);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        return this.map(models.TenantResponse, tenant);
    }

    @POST
    @Path('')
    async createTenant(data: models.TenantRequest): Promise<models.TenantResponse> {
        throw new Errors.NotImplementedError();
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

    @GET
    @Path(':id/company')
    @Tags('TenantCompany')
    async getTenantCompany(@PathParam('id') id: string): Promise<models.TenantCompanyResponse> {
        const tenant = await this.service.get(id);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        if (!tenant.dwollaUri) {
            throw new Errors.NotFoundError('Tenant company details not found');
        }

        return this.map(models.TenantCompanyResponse, tenant.company);
    }

    @GET
    @Path(':id/company/owner')
    @Tags('TenantCompany')
    async getTenantCompanyOwner(@PathParam('id') id: string): Promise<models.TenantOwnerResponse> {
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
    @Path('/company')
    @Tags('TenantCompany')
    async createTenantCompany(data: models.TenantCompanyPostRequest): Promise<models.TenantCompanyResponse> {
        const tenant: models.Tenant = await this.service.get(this.tenantContext.get());
        const parsedData: models.TenantCompanyPostRequest = await this.validate(data, models.tenantCompanyPostRequestSchema);

        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (tenant.dwollaUri) {
            throw new Errors.NotAcceptableError('Tenant company details already created');
        }

        try {
            await this.dwollaClient.authorize();
            const customer = dwolla.customer.factory(parsedData);
            customer.type = dwolla.customer.TYPE.Business;
            tenant.dwollaUri = await this.dwollaClient.createCustomer(customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(tenant.dwollaUri);
            tenant.dwollaStatus = dwollaCustomer.status;
            tenant.dwollaType = dwollaCustomer.type;
            tenant.merge(parsedData);

            await this.service.update(tenant);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError();
            }
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.TenantCompanyResponse, tenant.company);
    }

    @PATCH
    @Path('/company')
    @Tags('TenantCompany')
    async updateTenantCompany(data: models.TenantCompanyPatchRequest): Promise<models.TenantCompanyResponse> {
        const tenant: models.Tenant = await this.service.get(this.tenantContext.get());
        const parsedData: models.TenantCompanyPatchRequest = await this.validate(data, models.tenantCompanyPatchRequestSchema);

        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (!tenant.dwollaUri) {
            throw new Errors.NotFoundError('Tenant company details not found');
        }

        try {
            await this.dwollaClient.authorize();
            const customer = dwolla.customer.factory(parsedData);
            customer.type = tenant.dwollaType;
            await this.dwollaClient.updateCustomer(tenant.dwollaUri, customer.updateableFields());
            const dwollaCustomer = await this.dwollaClient.getCustomer(tenant.dwollaUri);
            tenant.dwollaStatus = dwollaCustomer.status;
            tenant.merge(parsedData);

            await this.service.update(tenant);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError();
            }
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.TenantCompanyResponse, tenant.company);
    }

    @GET
    @Path('/company/businessCategories')
    @Tags('TenantCompany')
    async getBusinessCategories() {
        let businessCategories;
        await this.dwollaClient.authorize();

        businessCategories = await this.dwollaClient.listBusinessClassification();
        return this.map(BusinessClassificationsResponse, businessCategories);
    }
}
