import {Inject} from 'typescript-ioc';
import {Errors, FileParam, GET, PATCH, Path, POST, Preprocessor, PUT, QueryParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';

import {BaseController} from '../api';
import * as dwolla from '../dwolla';
import * as _ from 'lodash';
import {
    AddTenantCompanyDocumentsLogic,
    AddTenantCompanyLogic,
    GetTenantCompanyLogic,
    GetTenantCompanyOwnerLogic,
    GetTenantLogic,
    ListTenantCompanyDocumentsLogic,
    RetryTenantCompanyLogic,
    UpdateTenantCompanyLogic,
} from './logic';
import * as models from './models';
import {BusinessClassificationsResponse} from './models';
import {TenantCompanyDocument} from './models';

@Security('api_key')
@Path('/tenants')
export class TenantController extends BaseController {
    @Inject private dwollaClient: dwolla.Client;

    /**
     * Create a new tenant
     * TODO: require thor
     *
     * @param {models.TenantRequest} data
     * @returns {Promise<models.TenantResponse>}
     * @memberof TenantController
     */
    @POST
    @Path('')
    @Tags('tenants')
    @Preprocessor(BaseController.requireAdmin)
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

    /**
     * Get the current tenant profile
     *
     * @returns {Promise<models.TenantResponse>}
     * @memberof TenantController
     */
    @GET
    @Path('')
    @Tags('tenants')
    @Preprocessor(BaseController.requireAdminReader)
    async getTenant(): Promise<models.TenantResponse> {
        const logic = new GetTenantLogic(this.getRequestContext());
        const tenant = await logic.execute(this.getRequestContext().getTenantId());

        return this.map(models.TenantResponse, tenant);
    }

    /**
     * Get the current tenant settings
     *
     * @returns {Promise<any>}
     * @memberof TenantController
     */
    @GET
    @Path('/settings')
    @Preprocessor(BaseController.requireAdminReader)
    async getTenantSettings(): Promise<any> {
        const logic = new GetTenantLogic(this.getRequestContext());
        const tenant = await logic.execute(this.getRequestContext().getTenantId());

        return tenant.settings;
    }

    /**
     * Create the current tenant company profile
     *
     * @param {models.TenantCompanyPostRequest} data
     * @returns {Promise<models.TenantCompanyResponse>}
     * @memberof TenantController
     */
    @POST
    @Path('/company')
    @Tags('tenantCompany')
    @Preprocessor(BaseController.requireAdmin)
    async createTenantCompany(data: models.TenantCompanyPostRequest): Promise<models.TenantCompanyResponse> {
        const parsedData: models.TenantCompanyPostRequest = await this.validate(
            data,
            models.tenantCompanyPostRequestSchema,
        );
        const logic = new AddTenantCompanyLogic(this.getRequestContext());
        const company = await logic.execute(parsedData, this.getRequestContext().getTenantId());

        return this.map(models.TenantCompanyResponse, company);
    }

    /**
     * Get the current tenant company profile
     *
     * @returns {Promise<models.TenantCompanyResponse>}
     * @memberof TenantController
     */
    @GET
    @Path('/company')
    @Tags('tenantCompany')
    @Preprocessor(BaseController.requireAdminReader)
    async getTenantCompany(): Promise<models.TenantCompanyResponse> {
        const logic = new GetTenantCompanyLogic(this.getRequestContext());
        const company = await logic.execute(this.getRequestContext().getTenantId());

        return this.map(models.TenantCompanyResponse, company);
    }

    /**
     * Update the current tenant company profile
     *
     * @param {models.TenantCompanyPatchRequest} data
     * @returns {Promise<models.TenantCompanyResponse>}
     * @memberof TenantController
     */
    @PATCH
    @Path('/company')
    @Tags('tenantCompany')
    @Preprocessor(BaseController.requireAdmin)
    async updateTenantCompany(data: models.TenantCompanyPatchRequest): Promise<models.TenantCompanyResponse> {
        const parsedData: models.TenantCompanyPatchRequest = await this.validate(
            data,
            models.tenantCompanyPatchRequestSchema,
        );
        const logic = new UpdateTenantCompanyLogic(this.getRequestContext());
        const company = await logic.execute(parsedData, this.getRequestContext().getTenantId());

        return this.map(models.TenantCompanyResponse, company);
    }

    /**
     * Resubmit the current tenant company profile
     *
     * @param {models.TenantCompanyRetryRequest} data
     * @returns {Promise<models.TenantCompanyResponse>}
     * @memberof TenantController
     */
    @PUT
    @Path('/company')
    @Tags('tenantCompany')
    @Preprocessor(BaseController.requireAdmin)
    async retryTenantCompany(data: models.TenantCompanyRetryRequest): Promise<models.TenantCompanyResponse> {
        const parsedData: models.TenantCompanyRetryRequest = await this.validate(
            data,
            models.tenantCompanyRetryRequestSchema,
        );
        const logic = new RetryTenantCompanyLogic(this.getRequestContext());
        const company = await logic.execute(parsedData, this.getRequestContext().getTenantId());

        return this.map(models.TenantCompanyResponse, company);
    }

    /**
     * Get the current tenant owner profile
     *
     * @returns {Promise<models.TenantOwnerResponse>}
     * @memberof TenantController
     */
    @GET
    @Path('/company/owner')
    @Tags('tenantCompany')
    @Preprocessor(BaseController.requireAdminReader)
    async getTenantCompanyOwner(): Promise<models.TenantOwnerResponse> {
        const logic = new GetTenantCompanyOwnerLogic(this.getRequestContext());
        const owner = await logic.execute(this.getRequestContext().getTenantId());

        return this.map(models.TenantOwnerResponse, owner);
    }

    /**
     * Get the list of business classifications for a tenant company
     *
     * @returns
     * @memberof TenantController
     */
    @GET
    @Path('/company/businessCategories')
    @Tags('tenantCompany')
    @Preprocessor(BaseController.requireAdminReader)
    async getBusinessCategories() {
        let businessCategories;

        businessCategories = await this.dwollaClient.listBusinessClassification();
        return this.map(BusinessClassificationsResponse, businessCategories);
    }

    /**
     * Get the list of documents uploaded for the current tenant company
     *
     * @returns {Promise<Array<TenantCompanyDocument>>}
     * @memberof TenantController
     */
    @GET
    @Path('/company/documents')
    @Preprocessor(BaseController.requireAdminReader)
    async getTenantCompanyDocuments(): Promise<Array<TenantCompanyDocument>> {
        const logic = new ListTenantCompanyDocumentsLogic(this.getRequestContext());
        const docs = await logic.execute(this.getRequestContext().getTenantId());

        return docs.map(doc => {
            return this.map(TenantCompanyDocument, doc);
        });
    }

    /**
     * Upload a document for the current tenant company
     *
     * @param {string} type
     * @param {*} file
     * @returns {Promise<TenantCompanyDocument>}
     * @memberof TenantController
     */
    @POST
    @Path('/company/documents')
    @Preprocessor(BaseController.requireAdmin)
    async createTenantCompanyDocuments(
        @QueryParam('type') type: string,
        @FileParam('filepond') file,
    ): Promise<TenantCompanyDocument> {
        if (!file) {
            throw new Errors.NotAcceptableError('File missing');
        }

        if (!_.has(dwolla.documents.TYPE, type)) {
            throw new Errors.ConflictError('Invalid type');
        }

        const logic = new AddTenantCompanyDocumentsLogic(this.getRequestContext());
        const doc = await logic.execute(this.getRequestContext().getTenantId(), file, type);

        return this.map(TenantCompanyDocument, doc);
    }
}
