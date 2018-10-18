import {BaseController} from '../api';
import {DELETE, GET, Path, PathParam, POST, Preprocessor} from 'typescript-rest';
import * as Errors from 'typescript-rest/dist/server-errors';
import {Profile} from '../profile/models';
import {
    FundingSource,
    FundingSourceBaseInfo,
    FundingSourceRequest,
    fundingSourceRequestSchema,
    FundingSourceResponse
} from './models';
import {transaction} from 'objection';
import {MailerService} from '../mailer';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {TransactionService} from '../transaction/service';
import * as context from '../context';
import {DwollaNotifier} from '../dwolla/notifier';
import {FundingSourceService} from './services';
import {InvitationService} from '../invitation/service';
import {AutoWired, Inject} from 'typescript-ioc';
import {Logger} from '../logger';
import {Config} from '../config';
import {Security, Tags} from 'typescript-rest-swagger';
import {User} from '../user/models';

export abstract class FundingSourceBaseController extends BaseController {
    protected dwollaClient: dwolla.Client;
    protected userService: UserService;
    protected profileService: ProfileService;
    protected transactionService: TransactionService;
    protected userContext: context.UserContext;
    protected dwollaNotifier: DwollaNotifier;
    protected fundingSourceService: FundingSourceService;
    protected mailer: MailerService;

    protected constructor(@Inject dwollaClient: dwolla.Client,
                          @Inject service: UserService,
                          @Inject profileService: ProfileService,
                          @Inject transactionService: TransactionService,
                          @Inject userContext: context.UserContext,
                          @Inject tenantContext: context.TenantContext,
                          @Inject logger: Logger, @Inject config: Config,
                          @Inject dwollaNotifier: DwollaNotifier,
                          @Inject fundingSourceService: FundingSourceService,
                          @Inject mailer: MailerService) {
        super(logger, config);
        this.dwollaClient = dwollaClient;
        this.userService = service;
        this.profileService = profileService;
        this.transactionService = transactionService;
        this.userContext = userContext;
        this.dwollaNotifier = dwollaNotifier;
        this.fundingSourceService = fundingSourceService;
        this.mailer = mailer;
    }

    protected async _setDefaultFundingSource(fundingId: string, userId: string) {
        try {
            const fundingSource = await this.fundingSourceService.get(fundingId);
            if (!fundingSource) {
                throw new Errors.NotFoundError(`Could not find funding source for id ${fundingId}`);
            }

            const profile = await this.profileService.get(fundingSource.profileId);
            if (profile.userId != userId) {
                throw new Errors.InternalServerError('Funding source can only be edited by its owner.');
            }

            await this.fundingSourceService.setDefault(fundingSource);
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    protected async _getDefaultFundingSource(user: User): Promise<FundingSource> {
        const fundingSource = await this.fundingSourceService.getDefault(user.id);
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

        const profile: Profile = user.tenantProfile;
        try {

            await this.dwollaClient.authorize();
            const sourceUri = await this.dwollaClient.createFundingSource(
                profile.dwollaUri,
                parsedData.routing,
                parsedData.account,
                'checking',
                parsedData.name,
            );

            const fundingSource: FundingSource = FundingSource.factory({
                routing: parsedData.routing,
                account: parsedData.account,
                type: 'checking',
                name: parsedData.name,
                profileId: profile.id,
                tenantId: profile.tenantId,
                isDefault: false,
                dwollaUri: sourceUri
            });

            const sourceInfo = {
                sourceUri: profile.dwollaSourceUri,
                routing: profile.dwollaRouting,
                account: profile.dwollaAccount,
            };

            const fundingSources = await this.fundingSourceService.getAllFundingSource(user.id);
            if (!fundingSources || fundingSources.length == 0) {
                fundingSource.isDefault = true;
            }

            try {
                await this.mailer.sendFundingSourceCreated(user, sourceInfo);
            } catch (e) {
                this.logger.error(e);
            }

            let fundingSourceResult;

            await transaction(this.profileService.transaction(), async trx => {
                fundingSourceResult = await this.fundingSourceService.insert(fundingSource, trx);
                await this.profileService.addFundingSource(profile, fundingSource, trx);
            });

            return this.map(FundingSourceResponse, fundingSourceResult);
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

        // TODO: implement
        throw new Errors.NotImplementedError();
        // const profile = user.tenantProfile;
        //
        // try {
        //     const sourceInfo = {
        //         sourceUri: profile.dwollaSourceUri,
        //         routing: profile.dwollaRouting,
        //         account: profile.dwollaAccount,
        //     };
        //
        //     await this.dwollaClient.authorize();
        //     await this.dwollaClient.deleteFundingSource(profile.dwollaSourceUri);
        //
        //     try {
        //         await this.mailer.sendFundingSourceRemoved(user, sourceInfo);
        //     } catch (e) {
        //         this.logger.error(e);
        //     }
        // } catch (err) {
        //     this.logger.error(err);
        //     throw new Errors.InternalServerError(err.message);
        // }
    }
}

@AutoWired
@Security('api_key')
@Path('/users/:id/fundingSources')
@Tags('users', 'fundingSources')
@Preprocessor(BaseController.requireAdmin)
export class UserFundingSourceController extends FundingSourceBaseController {
    constructor(@Inject dwollaClient: dwolla.Client,
                @Inject service: UserService,
                @Inject profileService: ProfileService,
                @Inject transactionService: TransactionService,
                @Inject userContext: context.UserContext,
                @Inject tenantContext: context.TenantContext,
                @Inject logger: Logger,
                @Inject config: Config,
                @Inject dwollaNotifier: DwollaNotifier,
                @Inject fundingSourceService: FundingSourceService,
                @Inject mailer: MailerService) {
        super(dwollaClient, service, profileService, transactionService, userContext, tenantContext, logger, config, dwollaNotifier, fundingSourceService, mailer);
    }

    @GET
    @Path('default')
    async getDefaultFundingSource(@PathParam('id') userId: string) {
        const user = await this.userService.get(userId);
        return await super._getDefaultFundingSource(user);
    }

    @POST
    @Path(':fundingId/default')
    async setDefaultFundingSource(@PathParam('id') userId: string, @PathParam('fundingId') id: string) {
        return await super._setDefaultFundingSource(id, userId);
    }

    @POST
    @Path('')
    async createUserFundingSource(@PathParam('id') userId: string, data: FundingSourceRequest): Promise<FundingSourceResponse> {
        const user = await this.userService.get(userId);
        return await this._createUserFundingSource(user, data);
    }

    @DELETE
    @Path(':fundingId')
    async deleteUserFundingSource(@PathParam('id') userId: string, @PathParam('fundingId') id: string) {
        const user = await this.userService.get(userId);
        return await this._deleteUserFundingSource(user, id);
    }
}

@AutoWired
@Security('api_key')
@Path('/contractors/fundingSources')
@Tags('contractors', 'fundingSources')
@Preprocessor(BaseController.requireContractor)
export class ContractorFundingSourceController extends FundingSourceBaseController {
    constructor(@Inject dwollaClient: dwolla.Client,
                @Inject service: UserService,
                @Inject profileService: ProfileService,
                @Inject transactionService: TransactionService,
                @Inject userContext: context.UserContext,
                @Inject tenantContext: context.TenantContext,
                @Inject logger: Logger,
                @Inject config: Config,
                @Inject dwollaNotifier: DwollaNotifier,
                @Inject fundingSourceService: FundingSourceService,
                @Inject mailer: MailerService) {
        super(dwollaClient, service, profileService, transactionService, userContext, tenantContext, logger, config, dwollaNotifier, fundingSourceService, mailer);
    }

    @GET
    @Path('default')
    async getDefaultFundingSource() {
        const user = await this.userService.get(this.userContext.get().id);
        return await super._getDefaultFundingSource(user);
    }

    @POST
    @Path(':id/default')
    async setDefaultFundingSource(@PathParam('id') id: string) {
        return await super._setDefaultFundingSource(id, this.userContext.get().id);
    }

    @POST
    @Path('')
    async createUserFundingSource(data: FundingSourceRequest): Promise<FundingSourceResponse> {
        const user = await this.userService.get(this.userContext.get().id);
        return await this._createUserFundingSource(user, data);
    }

    @DELETE
    @Path(':id')
    async deleteUserFundingSource(@PathParam('id') id: string) {
        const user = await this.userService.get(this.userContext.get().id);
        return await this._deleteUserFundingSource(user, id);
    }
}