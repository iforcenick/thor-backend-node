import * as _ from 'lodash';
import {Inject} from 'typescript-ioc';
import {Errors, FileParam, GET, PATCH, Path, POST, Preprocessor, PUT, QueryParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import * as logicLayer from './logic';
import * as models from './models';
import {BusinessClassificationsResponse} from './models';
import {TenantCompanyDocument} from './models';
import * as payments from '../payment';

@Security('api_key')
@Path('/tenants')
@Tags('tenants')
export class TenantController extends BaseController {
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
    @Preprocessor(BaseController.requireAdminReader)
    async getTenant(): Promise<models.TenantResponse> {
        const logic = new logicLayer.GetTenantLogic(this.getRequestContext());
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
        const logic = new logicLayer.GetTenantLogic(this.getRequestContext());
        const tenant = await logic.execute(this.getRequestContext().getTenantId());
        return tenant.settings;
    }
}

@Security('api_key')
@Path('/tenants/company')
@Tags('tenants', 'company')
export class TenantCompanyController extends BaseController {
    @Inject private paymentClient: payments.PaymentClient;

    /**
     * Create the current tenant company profile
     *
     * @param {models.TenantCompanyRequest} data
     * @returns {Promise<models.TenantCompanyResponse>}
     * @memberof TenantController
     */
    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createTenantCompany(data: models.TenantCompanyRequest): Promise<models.TenantCompanyResponse> {
        const parsedData: models.TenantCompanyRequest = await this.validate(data, models.tenantCompanyRequestSchema);
        const logic = new logicLayer.AddTenantCompanyLogic(this.getRequestContext());
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
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getTenantCompany(): Promise<models.TenantCompanyResponse> {
        const logic = new logicLayer.GetTenantCompanyLogic(this.getRequestContext());
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
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async updateTenantCompany(data: models.TenantCompanyPatchRequest): Promise<models.TenantCompanyResponse> {
        const parsedData: models.TenantCompanyPatchRequest = await this.validate(
            data,
            models.tenantCompanyPatchRequestSchema,
        );
        const logic = new logicLayer.UpdateTenantCompanyLogic(this.getRequestContext());
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
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async retryTenantCompany(data: models.TenantCompanyRetryRequest): Promise<models.TenantCompanyResponse> {
        const parsedData: models.TenantCompanyRetryRequest = await this.validate(
            data,
            models.tenantCompanyRetryRequestSchema,
        );
        const logic = new logicLayer.RetryTenantCompanyLogic(this.getRequestContext());
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
    @Path('/owner')
    @Preprocessor(BaseController.requireAdminReader)
    async getTenantCompanyOwner(): Promise<models.TenantOwnerResponse> {
        const logic = new logicLayer.GetTenantCompanyOwnerLogic(this.getRequestContext());
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
    @Path('/businessCategories')
    @Preprocessor(BaseController.requireAdminReader)
    async getBusinessCategories() {
        let businessCategories;

        businessCategories = await this.paymentClient.listBusinessClassification();
        return this.map(BusinessClassificationsResponse, businessCategories);
    }

    /**
     * Get the list of documents uploaded for the current tenant company
     *
     * @returns {Promise<Array<TenantCompanyDocument>>}
     * @memberof TenantController
     */
    @GET
    @Path('/documents')
    @Preprocessor(BaseController.requireAdminReader)
    async getTenantCompanyDocuments(): Promise<Array<TenantCompanyDocument>> {
        const logic = new logicLayer.ListTenantCompanyDocumentsLogic(this.getRequestContext());
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
    @Path('/documents')
    @Preprocessor(BaseController.requireAdmin)
    async createTenantCompanyDocuments(
        @QueryParam('type') type: string,
        @FileParam('filepond') file,
    ): Promise<TenantCompanyDocument> {
        if (!file) {
            throw new Errors.NotAcceptableError('File missing');
        }

        if (!_.has(payments.documents.TYPE, type)) {
            throw new Errors.ConflictError('Invalid type');
        }

        const logic = new logicLayer.AddTenantCompanyDocumentsLogic(this.getRequestContext());
        const doc = await logic.execute(this.getRequestContext().getTenantId(), file, type);

        return this.map(TenantCompanyDocument, doc);
    }
}
