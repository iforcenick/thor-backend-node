import {BaseController} from '../../api';
import * as models from './models';
import * as dwolla from '../../dwolla';
import {AutoWired} from 'typescript-ioc';
import {DELETE, GET, PATCH, Path, POST, Preprocessor} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {
    DeleteTenantFundingSourcesLogic,
    GetTenantFundingSourceLogic,
    InitiateTenantFundingSourceVerificationLogic,
    VerifyTenantFundingSourceLogic
} from './logic';

@AutoWired
@Path('/tenants/company/fundingSources')
@Preprocessor(BaseController.requireAdmin)
@Security('api_key')
@Tags('tenantCompany', 'fundingSources')
export class TenantFundingSourcesController extends BaseController {
    @GET
    @Path('')
    async getFundingSource(): Promise<models.TenantFundingSourceResponse> {
        const logic = new GetTenantFundingSourceLogic(this.getRequestContext());
        const result = await logic.execute(this.getRequestContext().getTenantId());
        return this.map(models.TenantFundingSourceResponse, result);
    }

    @DELETE
    @Path('')
    async deleteFundingSource() {
        const logic = new DeleteTenantFundingSourcesLogic(this.getRequestContext());
        await logic.execute(this.getRequestContext().getTenantId());
    }

    @POST
    @Path('/verify')
    async initiateFundingSourceVerification() {
        const logic = new InitiateTenantFundingSourceVerificationLogic(this.getRequestContext());
        await logic.execute(this.getRequestContext().getTenantId());
    }

    @PATCH
    @Path('/verify')
    async verifyFundingSource(data: models.TenantFundingSourceVerificationRequest) {
        const parsedData: models.TenantFundingSourceVerificationRequest = await this.validate(data, models.tenantFundingSourceVerificationRequestSchema);
        const logic = new VerifyTenantFundingSourceLogic(this.getRequestContext());
        await logic.execute(parsedData.amount1, parsedData.amount2, this.getRequestContext().getTenantId());
    }
}