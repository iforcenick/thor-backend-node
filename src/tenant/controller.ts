import {Errors, GET, PATCH, Path, POST, Preprocessor} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {BusinessClassificationsResponse} from './models';
import {TenantService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import {DwollaNotifier} from '../dwolla/notifier';
import {UserService} from '../user/service';

@Security('api_key')
@Path('/tenants')
@Tags('tenants')
@Preprocessor(BaseController.requireAdmin)
export class TenantController extends BaseController {
    @Inject private service: TenantService;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private dwollaNotifier: DwollaNotifier;
    @Inject private userService: UserService;

    @GET
    @Path('')
    async getTenant(): Promise<models.TenantResponse> {
        const tenant = await this.service.get(this.getRequestContext().getTenantId());
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        return this.map(models.TenantResponse, tenant);
    }

    @POST
    @Path('')
    async createTenant(data: models.TenantRequest): Promise<models.TenantResponse> {
        throw new Errors.NotImplementedError();
        // const parsedData = await this.validate(data, models.tenantRequestSchema);
        // let tenant = models.Tenant.factory(parsedData);
        // try {
        //     await transaction(models.Tenant.knex(), async trx => {
        //         tenant = await this.service.insert(tenant, trx);
        //     });
        //     tenant = await this.service.get(tenant.id);
        // } catch (err) {
        //     this.logger.error(err);
        //     throw new Errors.InternalServerError(err.message);
        // }
        //
        // return this.map(models.TenantResponse, tenant);
    }

    @GET
    @Path('/company')
    @Tags('tenantCompany')
    async getTenantCompany(): Promise<models.TenantCompanyResponse> {
        const tenant = await this.service.get(this.getRequestContext().getTenantId());
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        if (!tenant.dwollaUri) {
            throw new Errors.NotFoundError('Tenant company details not found');
        }

        return this.map(models.TenantCompanyResponse, tenant.company);
    }

    @GET
    @Path('/company/owner')
    @Tags('tenantCompany')
    async getTenantCompanyOwner(): Promise<models.TenantOwnerResponse> {
        const tenant = await this.service.get(this.getRequestContext().getTenantId());
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
    @Tags('tenantCompany')
    async createTenantCompany(data: models.TenantCompanyPostRequest): Promise<models.TenantCompanyResponse> {
        const tenant: models.Tenant = await this.service.get(this.getRequestContext().getTenantId());
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
    @Tags('tenantCompany')
    async updateTenantCompany(data: models.TenantCompanyPatchRequest): Promise<models.TenantCompanyResponse> {
        const tenant: models.Tenant = await this.service.get(this.getRequestContext().getTenantId());
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
    @Tags('tenantCompany')
    async getBusinessCategories() {
        let businessCategories;
        await this.dwollaClient.authorize();

        businessCategories = await this.dwollaClient.listBusinessClassification();
        return this.map(BusinessClassificationsResponse, businessCategories);
    }
}
