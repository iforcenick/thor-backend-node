import {AutoWired} from 'typescript-ioc';
import {DELETE, GET, PATCH, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import * as logicLayer from './logic';
import * as models from './models';

@AutoWired
@Security('api_key')
@Path('/fundingSources')
@Tags('fundingSources')
@Preprocessor(BaseController.requireAdmin)
export class FundingSourceController extends BaseController {
    /**
     * Trigger the micro-deposit verification process for a funding source
     *
     * @param {string} id
     * @memberof FundingSourceController
     */
    @POST
    @Path(':id/verify')
    async initiateFundingSourceVerification(@PathParam('id') id: string) {
        const logic = new logicLayer.InitiateFundingSourceVerificationLogic(this.getRequestContext());
        await logic.execute(id);
    }

    /**
     * Verify a funding source using micro-deposits
     *
     * @param {string} id
     * @param {models.FundingSourceVerificationRequest} data
     * @memberof FundingSourceController
     */
    @PATCH
    @Path(':id/verify')
    async verifyFundingSource(@PathParam('id') id: string, data: models.FundingSourceVerificationRequest) {
        const parsedData: models.FundingSourceVerificationRequest = await this.validate(
            data,
            models.fundingSourceVerificationRequestSchema,
        );
        const logic = new logicLayer.VerifyFundingSourceLogic(this.getRequestContext());
        await logic.execute(parsedData.amount1, parsedData.amount2, id);
    }
}

@AutoWired
@Security('api_key')
@Path('/users/:userId/fundingSources')
@Tags('users', 'fundingSources')
export class UserFundingSourceController extends BaseController {
    /**
     * Get a user's default funding source
     *
     * @param {string} userId
     * @returns {Promise<models.FundingSourceResponse>}
     * @memberof UserFundingSourceController
     */
    @GET
    @Path('default')
    @Preprocessor(BaseController.requireAdminReader)
    async getDefaultFundingSource(@PathParam('userId') userId: string): Promise<models.FundingSourceResponse> {
        const logic = new logicLayer.GetDefaultFundingSourceLogic(this.getRequestContext());
        const fundingSource = await logic.execute(userId);
        return this.map(models.FundingSourceResponse, fundingSource);
    }

    /**
     * Set a user's default funding source
     *
     * @param {string} userId
     * @param {string} id
     * @returns
     * @memberof UserFundingSourceController
     */
    @POST
    @Path(':id/default')
    @Preprocessor(BaseController.requireAdmin)
    async setDefaultFundingSource(@PathParam('userId') userId: string, @PathParam('id') id: string) {
        const logic = new logicLayer.SetDefaultFundingSourceLogic(this.getRequestContext());
        const fundingSource = await logic.execute(id, userId);
        return this.map(models.FundingSourceResponse, fundingSource);
    }

    /**
     * Create a user's funding source using a bank account
     *
     * @param {string} userId
     * @param {models.FundingSourceRequest} data
     * @returns {Promise<models.FundingSourceResponse>}
     * @memberof UserFundingSourceController
     */
    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createFundingSourceFromBankAccount(
        @PathParam('userId') userId: string,
        data: models.FundingSourceRequest,
    ): Promise<models.FundingSourceResponse> {
        const parsedData: models.FundingSourceRequest = await this.validate(data, models.fundingSourceRequestSchema);
        const logic = new logicLayer.CreateFundingSourceFromBankAccountLogic(this.getRequestContext());
        const fundingSource = await logic.execute(parsedData, userId);
        return this.map(models.FundingSourceResponse, fundingSource);
    }

    /**
     * Delete a user's funding source
     *
     * @param {string} userId
     * @param {string} id
     * @memberof UserFundingSourceController
     */
    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteFundingSource(@PathParam('userId') userId: string, @PathParam('id') id: string) {
        const logic = new logicLayer.DeleteFundingSourceLogic(this.getRequestContext());
        await logic.execute(id, userId);
    }

    /**
     * Query for a list of a user's funding sources
     *
     * @param {string} userId
     * @param {number} [page]
     * @param {number} [limit]
     * @returns
     * @memberof UserFundingSourceController
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getFundingSources(
        @PathParam('userId') userId: string,
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
    ) {
        const logic = new logicLayer.GetFundingSourcesLogic(this.getRequestContext());
        const fundingSourcesList = await logic.execute(userId, page, limit);
        return this.paginate(
            fundingSourcesList.pagination,
            fundingSourcesList.rows.map(fundingSource => {
                return this.map(models.FundingSourceResponse, fundingSource);
            }),
        );
    }

    /**
     * Create a user's funding source using an IAV URI
     *
     * @param {string} userId
     * @param {models.FundingSourceIavRequest} data
     * @returns {Promise<models.FundingSourceResponse>}
     * @memberof UserFundingSourceController
     */
    @POST
    @Path('iav')
    @Preprocessor(BaseController.requireAdmin)
    async createFundingSourceFromIav(
        @PathParam('userId') userId: string,
        data: models.FundingSourceIavRequest,
    ): Promise<models.FundingSourceResponse> {
        const parsedData: models.FundingSourceIavRequest = await this.validate(
            data,
            models.fundingSourceIavRequestSchema,
        );
        const logic = new logicLayer.CreateFundingSourceFromIavLogic(this.getRequestContext());
        const fundingSource = await logic.execute(userId, parsedData.uri);
        return this.map(models.FundingSourceResponse, fundingSource);
    }

    /**
     * Get an IAV token
     *
     * @param {string} userId
     * @returns {Promise<models.FundingSourceIavToken>}
     * @memberof UserFundingSourceController
     */
    @GET
    @Path('iav')
    @Preprocessor(BaseController.requireAdminReader)
    async getIavToken(@PathParam('userId') userId: string): Promise<models.FundingSourceIavToken> {
        const logic = new logicLayer.GetIavTokenLogic(this.getRequestContext());
        const token = await logic.execute(userId);
        return this.map(models.FundingSourceIavToken, {token});
    }
}

@AutoWired
@Security('api_key')
@Path('/contractors/fundingSources')
@Tags('contractors', 'fundingSources')
@Preprocessor(BaseController.requireContractor)
export class ContractorFundingSourceController extends BaseController {
    /**
     * Get your funding sources
     *
     * @param {number} [page]
     * @param {number} [limit]
     * @returns
     * @memberof ContractorFundingSourceController
     */
    @GET
    @Path('')
    async getFundingSources(@QueryParam('page') page?: number, @QueryParam('limit') limit?: number) {
        const logic = new logicLayer.GetFundingSourcesLogic(this.getRequestContext());
        const fundingSourcesList = await logic.execute(this.getRequestContext().getUserId(), page, limit);
        return this.paginate(
            fundingSourcesList.pagination,
            fundingSourcesList.rows.map(fundingSource => {
                return this.map(models.FundingSourceResponse, fundingSource);
            }),
        );
    }

    /**
     * Get your defualt funding source
     *
     * @returns
     * @memberof ContractorFundingSourceController
     */
    @GET
    @Path('default')
    async getDefaultFundingSource() {
        const logic = new logicLayer.GetDefaultFundingSourceLogic(this.getRequestContext());
        const fundingSource = await logic.execute(this.getRequestContext().getUserId());
        return this.map(models.FundingSourceResponse, fundingSource);
    }

    /**
     * Set your default funding source
     *
     * @param {string} id
     * @returns
     * @memberof ContractorFundingSourceController
     */
    @POST
    @Path(':id/default')
    async setDefaultFundingSource(@PathParam('id') id: string) {
        const logic = new logicLayer.SetDefaultFundingSourceLogic(this.getRequestContext());
        const fundingSource = await logic.execute(id, this.getRequestContext().getUserId());
        return this.map(models.FundingSourceResponse, fundingSource);
    }

    /**
     * Delete your funding source
     *
     * @param {string} id
     * @memberof ContractorFundingSourceController
     */
    @DELETE
    @Path(':id')
    async deleteFundingSource(@PathParam('id') id: string) {
        const logic = new logicLayer.DeleteFundingSourceLogic(this.getRequestContext());
        await logic.execute(id, this.getRequestContext().getUserId());
    }

    /**
     * Create your funding source using an IAV URI
     *
     * @param {models.FundingSourceIavRequest} data
     * @returns {Promise<models.FundingSourceResponse>}
     * @memberof ContractorFundingSourceController
     */
    @POST
    @Path('iav')
    async createFundingSourceFromIav(data: models.FundingSourceIavRequest): Promise<models.FundingSourceResponse> {
        const parsedData: models.FundingSourceIavRequest = await this.validate(
            data,
            models.fundingSourceIavRequestSchema,
        );
        const logic = new logicLayer.CreateFundingSourceFromIavLogic(this.getRequestContext());
        const fundingSource = await logic.execute(this.getRequestContext().getUserId(), parsedData.uri);
        return this.map(models.FundingSourceResponse, fundingSource);
    }

    /**
     * Get an IAV token
     *
     * @returns {Promise<models.FundingSourceIavToken>}
     * @memberof ContractorFundingSourceController
     */
    @GET
    @Path('iav')
    async getIavToken(): Promise<models.FundingSourceIavToken> {
        const logic = new logicLayer.GetIavTokenLogic(this.getRequestContext());
        const token = await logic.execute(this.getRequestContext().getUserId());
        return this.map(models.FundingSourceIavToken, {token});
    }
}
