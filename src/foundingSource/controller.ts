import {BaseController} from '../api';
import {
    Context, DELETE, Errors, GET, PATCH, Path, PathParam, POST, Preprocessor, QueryParam,
    ServiceContext
} from 'typescript-rest';
import * as models from './models';
import {MailerService} from '../mailer';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {FundingSourceService} from './services';
import {AutoWired, Inject} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import {User} from '../user/models';
import {Pagination} from '../db';
import * as logicLayer from './logic';
import {FundingSource, FundingSourceRequest, fundingSourceRequestSchema, FundingSourceResponse} from './models';
import {CreateUserFundingSourceLogic} from './logic';


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
        const logic = new logicLayer.InitiateContractorFundingSourceVerificationLogic(this.getRequestContext());
        await logic.execute(id);
    }

    @PATCH
    @Path(':id/verify')
    async verifyFundingSource(@PathParam('id') id: string, data: models.UserFundingSourceVerificationRequest) {
        const parsedData: models.UserFundingSourceVerificationRequest = await this.validate(data, models.contractorFundingSourceVerificationRequestSchema);
        const logic = new logicLayer.VerifyContractorFundingSourceLogic(this.getRequestContext());
        await logic.execute(parsedData.amount1, parsedData.amount2, id);
    }
}

@AutoWired
export abstract class FundingSourceBaseController extends BaseController {
    @Inject protected dwollaClient: dwolla.Client;
    @Inject protected userService: UserService;
    @Inject protected profileService: ProfileService;
    @Inject protected fundingSourceService: FundingSourceService;
    @Inject protected mailer: MailerService;

    protected async _setDefaultFundingSource(fundingId: string, userId: string) {
        const logic = new logicLayer.SetDefaultFundingSourceLogic(this.getRequestContext());
        const fundingSource = await logic.execute(fundingId, userId);

        return this.map(models.FundingSourceResponse, fundingSource);
    }

    protected async _getDefaultFundingSource(user: User): Promise<models.FundingSource> {
        const logic = new logicLayer.ContractorDefaultFundingSourcesLogic(this.getRequestContext());
        const fundingSource = await logic.execute(user.id);
        if (!fundingSource) {
            throw new Errors.NotFoundError();
        }
        return fundingSource;
    }

    protected async _deleteUserFundingSource(user: User, id: string) {
        if (!user) {
            throw new Errors.NotFoundError();
        }

        try {
            const logic = new logicLayer.DeleteFundingSourceLogic(this.getRequestContext());
            await logic.execute(id, user);
        } catch (err) {
            this.logger.error(err.message);
            throw new Errors.InternalServerError(err.message);
        }
    }

    protected async _getFundingSources(user: User, page: number = 1, limit: number = this.config.get('pagination.limit')) {
        const logic = new logicLayer.GetUserFundingSourcesLogic(this.getRequestContext());
        const fundingSources = await logic.execute(user);

        return this.paginate(new Pagination(page, limit, fundingSources.length), fundingSources.map(fundingSource => {
            return this.map(models.FundingSourceResponse, fundingSource);
        }));
    }

    protected async _addVerifyingFundingSource(user: User, data: models.FundingSourceIavRequest): Promise<FundingSource> {
        const parsedData: models.FundingSourceIavRequest = await this.validate(data, models.fundingSourceIavRequestSchema);
        const logic = new logicLayer.AddVerifyingFundingSourceLogic(this.getRequestContext());
        return await logic.execute(user, parsedData.uri);
    }

    protected async _getIavToken(user: User) {
        const logic = new logicLayer.GetIavTokenLogic(this.getRequestContext());
        return await logic.execute(user);
    }
}


@AutoWired
@Security('api_key')
@Path('/users/:userId/fundingSources')
@Tags('users', 'fundingSources')
export class UserFundingSourceController extends FundingSourceBaseController {
    @Context protected context: ServiceContext;

    @GET
    @Path('default')
    @Preprocessor(BaseController.requireAdminReader)
    async getDefaultFundingSource(@PathParam('userId') userId: string) {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError();
        }
        return await super._getDefaultFundingSource(user);
    }

    @POST
    @Path(':fundingId/default')
    @Preprocessor(BaseController.requireAdmin)
    async setDefaultFundingSource(@PathParam('userId') userId: string, @PathParam('fundingId') fundingId: string) {
        return await super._setDefaultFundingSource(fundingId, userId);
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createUserFundingSource(@PathParam('userId') userId: string, data: FundingSourceRequest): Promise<FundingSourceResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        const parsedData: FundingSourceRequest = await this.validate(data, fundingSourceRequestSchema);
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

    @DELETE
    @Path(':fundingId')
    @Preprocessor(BaseController.requireAdmin)
    async deleteUserFundingSource(@PathParam('userId') userId: string, @PathParam('fundingId') fundingId: string) {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError();
        }
        return await this._deleteUserFundingSource(user, fundingId);
    }

    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getFundingSources(@PathParam('userId') userId: string, @QueryParam('page') page?: number,
                            @QueryParam('limit') limit?: number) {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError();
        }
        return await super._getFundingSources(user, page, limit);
    }

    @POST
    @Path('iav')
    @Preprocessor(BaseController.requireAdmin)
    async addVerifyingFundingSource(@PathParam('userId') userId: string, data: models.FundingSourceIavRequest): Promise<models.FundingSourceResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError();
        }
        const source: FundingSource = await this._addVerifyingFundingSource(user, data);
        return this.map(models.FundingSourceResponse, source);
    }

    @GET
    @Path('iav')
    @Preprocessor(BaseController.requireAdminReader)
    async getIavToken(@PathParam('userId') userId: string): Promise<models.FundingSourceIavToken> {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError();
        }
        const token = await this._getIavToken(user);
        return this.map(models.FundingSourceIavToken, {token});
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
        if (!user) {
            throw new Errors.NotFoundError();
        }
        return await super._getDefaultFundingSource(user);
    }

    @POST
    @Path(':id/default')
    async setDefaultFundingSource(@PathParam('id') id: string) {
        return await super._setDefaultFundingSource(id, this.getRequestContext().getUserId());
    }

    @DELETE
    @Path(':id')
    async deleteUserFundingSource(@PathParam('id') id: string) {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(this.getRequestContext().getUserId());
        if (!user) {
            throw new Errors.NotFoundError();
        }
        return await this._deleteUserFundingSource(user, id);
    }

    @GET
    @Path('iav')
    async getIavToken(): Promise<models.FundingSourceIavToken> {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(this.getRequestContext().getUserId());
        if (!user) {
            throw new Errors.NotFoundError();
        }
        const token = await this._getIavToken(user);
        return this.map(models.FundingSourceIavToken, {token});
    }

    @POST
    @Path('iav')
    async addVerifyingFundingSource(data: models.FundingSourceIavRequest): Promise<models.FundingSourceResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        const user = await this.userService.get(this.getRequestContext().getUserId());
        if (!user) {
            throw new Errors.NotFoundError();
        }
        const source: FundingSource = await this._addVerifyingFundingSource(user, data);
        return this.map(models.FundingSourceResponse, source);
    }
}