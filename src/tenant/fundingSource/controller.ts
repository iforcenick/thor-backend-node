import {BaseController} from '../../api';
import * as models from './models';
import * as dwolla from '../../dwolla';
import {AutoWired, Inject} from 'typescript-ioc';
import {DELETE, GET, PATCH, Path, POST, Preprocessor} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import * as logicLayer from './logic';
import {UserService} from '../../user/service';
import {NotFoundError} from 'typescript-rest/dist/server-errors';

@AutoWired
@Path('/tenants/company/fundingSources')
@Preprocessor(BaseController.requireAdmin)
@Security('api_key')
@Tags('tenantCompany', 'fundingSources')
export class TenantFundingSourcesController extends BaseController {
    @Inject protected userService: UserService;

    @POST
    @Path('')
    async createFundingSource(request: models.CreateTenantFundingSourceRequest): Promise<models.TenantFundingSourceResponse> {
        const parsedData = await this.validate(request, models.createTenantFundingSourceRequestSchema);
        try {
            const logic = new logicLayer.CreateTenantFundingSourceLogic(this.getRequestContext());
            const result = await logic.execute(parsedData, this.getRequestContext().getTenantId());
            return this.map(models.TenantFundingSourceResponse, result);
        } catch (e) {
            if (e instanceof dwolla.DwollaRequestError) {
                throw e.toValidationError(null, {
                    account: 'account',
                    routing: 'routing'
                });
            }

            throw e;
        }
    }

    @GET
    @Path('')
    async getFundingSource(): Promise<models.TenantFundingSourceResponse> {
        const logic = new logicLayer.GetTenantFundingSourceLogic(this.getRequestContext());
        const result = await logic.execute(this.getRequestContext().getTenantId());
        return this.map(models.TenantFundingSourceResponse, result);
    }

    @DELETE
    @Path('')
    async deleteFundingSource() {
        const logic = new logicLayer.DeleteTenantFundingSourcesLogic(this.getRequestContext());
        await logic.execute(this.getRequestContext().getTenantId());
    }

    @POST
    @Path('/verify')
    async initiateFundingSourceVerification() {
        const logic = new logicLayer.InitiateTenantFundingSourceVerificationLogic(this.getRequestContext());
        await logic.execute(this.getRequestContext().getTenantId());
    }

    @PATCH
    @Path('/verify')
    async verifyFundingSource(data: models.TenantFundingSourceVerificationRequest) {
        const parsedData: models.TenantFundingSourceVerificationRequest = await this.validate(data, models.tenantFundingSourceVerificationRequestSchema);
        const logic = new logicLayer.VerifyTenantFundingSourceLogic(this.getRequestContext());
        await logic.execute(parsedData.amount1, parsedData.amount2, this.getRequestContext().getTenantId());
    }

    @POST
    @Path('iav')
    async addVeryfingFundingSource(data: models.FundingSourceIavRequest): Promise<models.TenantFundingSourceResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        const logic = new logicLayer.AddVerifyingFundingSourceForTenantLogic(this.getRequestContext());
        const user = await this.userService.get(this.getRequestContext().getUserId());
        if (!user) {
            throw new NotFoundError();
        }
        const result = await logic.execute(user, data.uri);
        return this.map(models.TenantFundingSourceResponse, result);
    }
}