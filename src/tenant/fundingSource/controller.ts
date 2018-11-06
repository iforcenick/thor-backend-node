import {BaseController} from '../../api';
import * as models from './models';
import * as dwolla from '../../dwolla';
import {AutoWired, Inject} from 'typescript-ioc';
import {Logger} from '../../logger';
import * as logic from './logic';
import {DELETE, Errors, GET, PATCH, Path, PathParam, POST, Preprocessor} from 'typescript-rest';
import {Security} from 'typescript-rest-swagger';
import {FundingSourceBaseInfo} from '../../foundingSource/models';

@AutoWired
@Path('/tenants/company/fundingSources')
@Preprocessor(BaseController.requireAdmin)
@Security('api_key')
export class TenantFundingSourcesController extends BaseController {
    @Inject private createTenantFundingSourceLogic: logic.CreateTenantFundingSourceLogic;
    @Inject private getTenantFundingSourcesLogic: logic.GetTenantFundingSourceLogic;
    @Inject private deleteTenantFundingSourcesLogic: logic.DeleteTenantFundingSourcesLogic;

    @Path('fundingSource')
    @POST
    async createFundingSource(request: models.CreateTenantFundingSourceRequest) {
        await this.validate(request, models.createTenantFundingSourceRequestSchema);
        try {
            const result = await this.createTenantFundingSourceLogic.execute(request, this.getRequestContext().getTenantId());
            return this.map(models.FundingSourceBase, result);
        } catch (e) {
            if (e instanceof dwolla.DwollaRequestError) {
                throw e.toValidationError(null, {
                    account: 'account',
                    routing: 'routing'
                });
            }
            this.logger.error(e);
            throw e;
        }
    }

    @Path('fundingSource')
    @GET
    async getFundingSource() {
        try {
            const result = await this.getTenantFundingSourcesLogic.execute(this.getRequestContext().getTenantId());
            return this.map(models.FundingSourceBase, result);
        } catch (e) {
            this.logger.error(e);
            throw e;
        }

    }

    @Path('fundingSource')
    @DELETE
    async deleteFundingSource() {
        try {
            await this.deleteTenantFundingSourcesLogic.execute(this.getRequestContext().getTenantId());
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

}