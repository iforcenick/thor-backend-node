import {BaseController} from '../api';
import {
    Context, DELETE, Errors, GET, PATCH, Path, PathParam, POST, Preprocessor, QueryParam,
    ServiceContext
} from 'typescript-rest';
import {
    contractorFundingSourceVerificationRequestSchema,
    FundingSource,
    FundingSourceBaseInfo, FundingSourceIavRequest, fundingSourceIavRequestSchema, FundingSourceIavToken,
    FundingSourceRequest,
    fundingSourceRequestSchema,
    FundingSourceResponse, UserFundingSourceVerificationRequest
} from './models';
import {MailerService} from '../mailer';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {FundingSourceService} from './services';
import {AutoWired, Inject} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import {User} from '../user/models';
import {Pagination} from '../db';
import {
    AddIavFundingSourceLogic, ContractorDefaultFundingSourcesLogic,
    CreateUserFundingSourceLogic, DeleteFundingSourceLogic, GetIavTokenLogic,
    InitiateContractorFundingSourceVerificationLogic,
    SetDefaultFundingSourceLogic, UserFundingSourcesLogic, VerifyContractorFundingSourceLogic
} from './logic';

@AutoWired
export abstract class FundingSourceBaseController extends BaseController {
    @Inject protected dwollaClient: dwolla.Client;
    @Inject protected userService: UserService;
    @Inject protected profileService: ProfileService;
    @Inject protected fundingSourceService: FundingSourceService;
    @Inject protected mailer: MailerService;

    protected async _setDefaultFundingSource(fundingId: string, userId: string) {
        const logic = new SetDefaultFundingSourceLogic(this.getRequestContext());
        const fundingSource = await logic.execute(fundingId, userId);

        return this.map(FundingSourceResponse, fundingSource);
    }

    protected async _getDefaultFundingSource(user: User): Promise<FundingSource> {
        const logic = new ContractorDefaultFundingSourcesLogic(this.getRequestContext());
        const fundingSource = await logic.execute(user.id);
        if (!fundingSource) {
            throw new Errors.NotFoundError();
        }
        return fundingSource;
    }

    protected async _createUserFundingSource(user: User, data: FundingSourceRequest): Promise<FundingSourceResponse> {
        const parsedData: FundingSourceBaseInfo = await this.validate(data, fundingSourceRequestSchema);
        if (!user) {
            throw new Errors.NotFoundError();
        }

        try {
            const logic = new CreateUserFundingSourceLogic(this.getRequestContext());
            const fundingSource = await logic.execute(parsedData, user);

            return this.map(FundingSourceResponse, fundingSource);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError(null, {
                    accountNumber: 'account',
                    routingNumber: 'routing',
                });
            }

            throw new Errors.InternalServerError(err.message);
        }
    }

    protected async _deleteUserFundingSource(user: User, id: string) {
        if (!user) {
            throw new Errors.NotFoundError();
        }

        try {
            const logic = new DeleteFundingSourceLogic(this.getRequestContext());
            await logic.execute(id, user);
        } catch (err) {
            this.logger.error(err.message);
            throw new Errors.InternalServerError(err.message);
        }
    }

    protected async _getFundingSources(user: User, page: number = 1, limit: number = this.config.get('pagination.limit')) {
        const logic = new UserFundingSourcesLogic(this.getRequestContext());
        const fundingSources = await logic.execute(user.id);

        return this.paginate(new Pagination(page, limit, fundingSources.length), fundingSources.map(fundingSource => {
            return this.map(FundingSourceResponse, fundingSource);
        }));
    }
}

@AutoWired
@Security('api_key')
@Path('/fundingSources')
@Tags('fundingSources')
@Preprocessor(BaseController.requireAdmin)
export class FundingSourceController extends BaseController {
    @Context protected context: ServiceContext;

    @POST
    @Path(':id/verify')
    async initiateFundingSourceVerification(@PathParam('id') id: string) {
        const logic = new InitiateContractorFundingSourceVerificationLogic(this.getRequestContext());
        await logic.execute(id);
    }

    @PATCH
    @Path(':id/verify')
    async verifyFundingSource(@PathParam('id') id: string, data: UserFundingSourceVerificationRequest) {
        const parsedData: UserFundingSourceVerificationRequest = await this.validate(data, contractorFundingSourceVerificationRequestSchema);
        const logic = new VerifyContractorFundingSourceLogic(this.getRequestContext());
        await logic.execute(parsedData.amount1, parsedData.amount2, id);
    }

}

@AutoWired
@Security('api_key')
@Path('/users/:userId/fundingSources')
@Tags('users', 'fundingSources')
@Preprocessor(BaseController.requireAdmin)
export class UserFundingSourceController extends FundingSourceBaseController {
    @Context protected context: ServiceContext;

    @GET
    @Path('default')
    async getDefaultFundingSource(@PathParam('userId') userId: string) {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        return await super._getDefaultFundingSource(user);
    }

    @POST
    @Path(':fundingId/default')
    async setDefaultFundingSource(@PathParam('userId') userId: string, @PathParam('fundingId') fundingId: string) {
        return await super._setDefaultFundingSource(fundingId, userId);
    }

    @POST
    @Path('')
    async createUserFundingSource(@PathParam('userId') userId: string, data: FundingSourceRequest): Promise<FundingSourceResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        return await this._createUserFundingSource(user, data);
    }

    @DELETE
    @Path(':fundingId')
    async deleteUserFundingSource(@PathParam('userId') userId: string, @PathParam('fundingId') fundingId: string) {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        return await this._deleteUserFundingSource(user, fundingId);
    }

    @GET
    @Path('')
    async getFundingSources(@PathParam('userId') userId: string, @QueryParam('page') page?: number,
                            @QueryParam('limit') limit?: number) {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        return await super._getFundingSources(user, page, limit);
    }
}

@AutoWired
@Security('api_key')
@Path('/contractors/fundingSources')
@Tags('contractors', 'fundingSources')
@Preprocessor(BaseController.requireContractor)
export class ContractorFundingSourceController extends FundingSourceBaseController {
    @Context protected context: ServiceContext;
    @Inject protected dwollaClient: dwolla.Client;

    @GET
    @Path('')
    async getFundingSources(@QueryParam('page') page?: number,
                            @QueryParam('limit') limit?: number) {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(this.getRequestContext().getUserId());
        return await super._getFundingSources(user, page, limit);
    }

    @GET
    @Path('default')
    async getDefaultFundingSource() {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(this.getRequestContext().getUserId());
        return await super._getDefaultFundingSource(user);
    }

    @POST
    @Path(':id/default')
    async setDefaultFundingSource(@PathParam('id') id: string) {
        return await super._setDefaultFundingSource(id, this.getRequestContext().getUserId());
    }

    @POST
    @Path('')
    async createUserFundingSource(data: FundingSourceRequest): Promise<FundingSourceResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(this.getRequestContext().getUserId());
        return await this._createUserFundingSource(user, data);
    }

    @DELETE
    @Path(':id')
    async deleteUserFundingSource(@PathParam('id') id: string) {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(this.getRequestContext().getUserId());
        return await this._deleteUserFundingSource(user, id);
    }

    @GET
    @Path('iav')
    async getIavToken(): Promise<FundingSourceIavToken> {
        const logic = new GetIavTokenLogic(this.getRequestContext());
        const token = await logic.execute(this.getRequestContext().getUserId());
        return this.map(FundingSourceIavToken, {token});
    }

    @POST
    @Path('iav')
    async addIavFundingSource(data: FundingSourceIavRequest): Promise<FundingSourceResponse> {
        const parsedData: FundingSourceIavRequest = await this.validate(data, fundingSourceIavRequestSchema);
        const logic = new AddIavFundingSourceLogic(this.getRequestContext());
        const token = await logic.execute(this.getRequestContext().getUserId(), parsedData.uri, parsedData.routing, parsedData.account);
        return this.map(FundingSourceResponse, {token});
    }
}