import {AutoWired, Inject} from 'typescript-ioc';
import {DELETE, GET, PATCH, Path, POST, Preprocessor} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {NotFoundError} from 'typescript-rest/dist/server-errors';
import {BaseController} from '../../api';
import {DwollaRequestError} from '../../payment/dwolla';
import {GetIavTokenForTenantLogic} from './logic';
import * as logicLayer from './logic';
import * as models from './models';
import {UserService} from '../../user/service';
import {TenantService} from '../service';

@AutoWired
@Security('api_key')
@Path('/tenants/company/fundingSources')
@Tags('tenant', 'company', 'fundingSources')
export class TenantFundingSourcesController extends BaseController {
    @Inject protected userService: UserService;
    @Inject protected tenantService: TenantService;

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createFundingSource(
        request: models.CreateTenantFundingSourceRequest,
    ): Promise<models.TenantFundingSourceResponse> {
        const parsedData = await this.validate(request, models.createTenantFundingSourceRequestSchema);
        try {
            const logic = new logicLayer.CreateTenantFundingSourceLogic(this.getRequestContext());
            const result = await logic.execute(parsedData, this.getRequestContext().getTenantId());
            return this.map(models.TenantFundingSourceResponse, result);
        } catch (e) {
            if (e instanceof DwollaRequestError) {
                throw e.toValidationError(null, {
                    account: 'account',
                    routing: 'routing',
                });
            }

            throw e;
        }
    }

    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getFundingSource(): Promise<models.TenantFundingSourceResponse> {
        const logic = new logicLayer.GetTenantFundingSourceLogic(this.getRequestContext());
        const result = await logic.execute(this.getRequestContext().getTenantId());
        return this.map(models.TenantFundingSourceResponse, result);
    }

    @DELETE
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async deleteFundingSource() {
        const logic = new logicLayer.DeleteTenantFundingSourcesLogic(this.getRequestContext());
        await logic.execute(this.getRequestContext().getTenantId());
    }

    @POST
    @Path('/verify')
    @Preprocessor(BaseController.requireAdmin)
    async initiateFundingSourceVerification() {
        const logic = new logicLayer.InitiateTenantFundingSourceVerificationLogic(this.getRequestContext());
        await logic.execute(this.getRequestContext().getTenantId());
    }

    @PATCH
    @Path('/verify')
    @Preprocessor(BaseController.requireAdmin)
    async verifyFundingSource(data: models.TenantFundingSourceVerificationRequest) {
        const parsedData: models.TenantFundingSourceVerificationRequest = await this.validate(
            data,
            models.tenantFundingSourceVerificationRequestSchema,
        );
        const logic = new logicLayer.VerifyTenantFundingSourceLogic(this.getRequestContext());
        await logic.execute(parsedData.amount1, parsedData.amount2, this.getRequestContext().getTenantId());
    }

    @POST
    @Path('iav')
    @Preprocessor(BaseController.requireAdmin)
    async addVeryfingFundingSource(data: models.FundingSourceIavRequest): Promise<models.TenantFundingSourceResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(this.getRequestContext().getUserId());
        if (!user) {
            throw new NotFoundError();
        }
        const logic = new logicLayer.AddVerifyingFundingSourceForTenantLogic(this.getRequestContext());
        const result = await logic.execute(user, data.uri);
        return this.map(models.TenantFundingSourceResponse, result);
    }

    @GET
    @Path('iav')
    @Preprocessor(BaseController.requireAdminReader)
    async getIavToken() {
        const tenant = await this.tenantService.get(this.getRequestContext().getTenantId());
        const logic = new GetIavTokenForTenantLogic(this.getRequestContext());

        const token = await logic.execute(tenant);
        return this.map(models.FundingSourceIavToken, {token});
    }
}
