import {Errors, GET, PATCH, Path, PathParam, POST, Preprocessor, PUT} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {BusinessClassificationsResponse} from './models';
import {TenantService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import {DwollaNotifier} from '../dwolla/notifier';
import {UserService} from '../user/service';
import {
    AddTenantCompanyLogic,
    GetTenantCompanyLogic,
    GetTenantCompanyOwnerLogic,
    GetTenantLogic, ListTenantCompanyDocumentsLogic,
    RetryTenantCompanyLogic,
    UpdateTenantCompanyLogic
} from './logic';
import {TenantCompanyDocument} from './models';

@Security('api_key')
@Path('/tenants')
@Preprocessor(BaseController.requireAdmin)
export class TenantController extends BaseController {
    @Inject private service: TenantService;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private dwollaNotifier: DwollaNotifier;
    @Inject private userService: UserService;

    @GET
    @Path('')
    @Tags('tenants')
    async getTenant(): Promise<models.TenantResponse> {
        const logic = new GetTenantLogic(this.getRequestContext());
        const tenant = await logic.execute(this.getRequestContext().getTenantId());

        return this.map(models.TenantResponse, tenant);
    }

    @POST
    @Path('')
    @Tags('tenants')
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
        const logic = new GetTenantCompanyLogic(this.getRequestContext());
        const company = await logic.execute(this.getRequestContext().getTenantId());

        return this.map(models.TenantCompanyResponse, company);
    }

    @GET
    @Path('/company/owner')
    @Tags('tenantCompany')
    async getTenantCompanyOwner(): Promise<models.TenantOwnerResponse> {
        const logic = new GetTenantCompanyOwnerLogic(this.getRequestContext());
        const owner = await logic.execute(this.getRequestContext().getTenantId());

        return this.map(models.TenantOwnerResponse, owner);
    }

    @POST
    @Path('/company')
    @Tags('tenantCompany')
    async createTenantCompany(data: models.TenantCompanyPostRequest): Promise<models.TenantCompanyResponse> {
        const parsedData: models.TenantCompanyPostRequest = await this.validate(data, models.tenantCompanyPostRequestSchema);
        const logic = new AddTenantCompanyLogic(this.getRequestContext());
        const company = await logic.execute(parsedData, this.getRequestContext().getTenantId());

        return this.map(models.TenantCompanyResponse, company);
    }

    @PATCH
    @Path('/company')
    @Tags('tenantCompany')
    async updateTenantCompany(data: models.TenantCompanyPatchRequest): Promise<models.TenantCompanyResponse> {
        const parsedData: models.TenantCompanyPatchRequest = await this.validate(data, models.tenantCompanyPatchRequestSchema);
        const logic = new UpdateTenantCompanyLogic(this.getRequestContext());
        const company = await logic.execute(parsedData, this.getRequestContext().getTenantId());

        return this.map(models.TenantCompanyResponse, company);
    }

    @PUT
    @Path('/company')
    @Tags('tenantCompany')
    async retryTenantCompany(data: models.TenantCompanyRetryRequest): Promise<models.TenantCompanyResponse> {
        const parsedData: models.TenantCompanyRetryRequest = await this.validate(data, models.tenantCompanyRetryRequestSchema);
        const logic = new RetryTenantCompanyLogic(this.getRequestContext());
        const company = await logic.execute(parsedData, this.getRequestContext().getTenantId());

        return this.map(models.TenantCompanyResponse, company);
    }

    @GET
    @Path('/company/businessCategories')
    @Tags('tenantCompany')
    async getBusinessCategories() {
        let businessCategories;

        businessCategories = await this.dwollaClient.listBusinessClassification();
        return this.map(BusinessClassificationsResponse, businessCategories);
    }

    @GET
    @Path('/company/documents')
    async getTenantCompanyDocuments(@PathParam('id') userId: string): Promise<Array<TenantCompanyDocument>> {
        const logic = new ListTenantCompanyDocumentsLogic(this.getRequestContext());
        const docs = await logic.execute(this.getRequestContext().getTenantId());

        return docs.map((doc) => {
            return this.map(TenantCompanyDocument, doc);
        });
    }
}
