import {
    ContextRequest,
    DELETE,
    Errors,
    FileParam,
    GET,
    HttpError,
    PATCH,
    Path,
    PathParam,
    POST,
    Preprocessor,
    QueryParam,
    ServiceContext,
} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import {UserService} from './service';
import * as models from './models';
import {Profile, ProfileResponse} from '../profile/models';
import {ProfileService} from '../profile/service';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import {ValidationError} from '../errors';
import * as transactions from '../transaction/models';
import {TransactionService} from '../transaction/service';
import {MailerService} from '../mailer';
import * as _ from 'lodash';
import * as context from '../context';
import {Config} from '../config';

@Security('api_key')
@Path('/users')
@Tags('users')
export class UserController extends BaseController {
    private mailer: MailerService;
    private dwollaClient: dwolla.Client;
    private service: UserService;
    private profileService: ProfileService;
    private transactionService: TransactionService;
    private userContext: context.UserContext;

    constructor(@Inject mailer: MailerService,
                @Inject dwollaClient: dwolla.Client,
                @Inject service: UserService,
                @Inject profileService: ProfileService,
                @Inject transactionService: TransactionService,
                @Inject userContext: context.UserContext,
                @Inject tenantContext: context.TenantContext,
                @Inject logger: Logger, @Inject config: Config) {
        super(logger, config);
        this.mailer = mailer;
        this.dwollaClient = dwollaClient;
        this.service = service;
        this.profileService = profileService;
        this.transactionService = transactionService;
        this.userContext = userContext;
    }

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async getUser(@PathParam('id') id: string): Promise<models.UserResponse> {
        const user = await this.service.get(id);

        if (!user) {
            throw new Errors.NotFoundError();
        }

        return this.map(models.UserResponse, user);
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     * @param startDate startDate
     * @param endDate endDate
     * @param status status
     */
    @GET
    @Path('/rating/jobs')
    @Preprocessor(BaseController.requireAdmin)
    async getRatingJobsList(@QueryParam('startDate') startDate: Date,
                            @QueryParam('endDate') endDate: Date,
                            @QueryParam('limit') limit?: number,
                            @QueryParam('page') page?: number,
                            @QueryParam('status') status?: string): Promise<models.PaginatedRankingJobs> {
        const dates: any = await this.validate({startDate, endDate}, models.rankingRequestSchema);
        const users: any = await this.service.getJobsRanking(dates.startDate, dates.endDate, page, limit, status);

        return this.paginate(
            users.pagination,
            users.rows.map(user => {
                user.transactionsIds = user.ids.split(',');
                user.rank = parseInt(user.rank);
                user.total = parseFloat(user.total);
                user.jobs = user.transactions;
                user.jobsCount = user.jobs.length;
                return this.map(models.RankingJobs, user);
            }),
        );
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async getUsersList(@QueryParam('page') page?: number, @QueryParam('limit') limit?: number): Promise<models.PaginatedUserResponse> {
        const users = await this.service.list(page, limit);

        return this.paginate(
            users.pagination,
            users.rows.map(user => {
                return this.map(models.UserResponse, user);
            }),
        );
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createUser(data: models.UserRequest): Promise<models.UserResponse> {
        const parsedData = await this.validate(data, models.userRequestSchema);
        ProfileService.validateAge(parsedData['profile']);

        let user = models.User.factory({});
        const profile = Profile.factory(parsedData['profile']);

        try {
            await this.dwollaClient.authorize();
            const customerData = dwolla.customer.factory(parsedData['profile']);
            customerData.type = dwolla.customer.TYPE.Personal;
            const customer = new dwolla.customer.Customer(customerData);
            profile.dwollaUri = await this.dwollaClient.createCustomer(customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(profile.dwollaUri);
            profile.dwollaStatus = dwollaCustomer.status;

            user = await this.service.createWithProfile(user, profile);
            user = await this.service.get(user.id);
            await this.sendNotificationForDwollaCustomer(user, dwollaCustomer.status);
        } catch (err) {
            this.logger.error(err);
            if (err.body) {
                const {body} = err;
                if (body.code) {
                    const {code} = body;
                    if (code === 'ValidationError') {
                        throw new ValidationError(`Invalid value for Fields: profile,${body._embedded.errors[0].path.replace('/', '')}`);
                    }
                }
            }
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.UserResponse, user);
    }

    @POST
    @Path(':id/fundingSource')
    @Preprocessor(BaseController.requireAdmin)
    async createUserFundingSource(@PathParam('id') id: string, data: models.FundingSourceRequest) {
        const parsedData = await this.validate(data, models.fundingSourceRequestSchema);
        const user = await this.service.get(id);
        if (!user) {
            throw new Errors.NotFoundError();
        }

        const profile = user.tenantProfile;

        try {
            await this.dwollaClient.authorize();
            profile.dwollaSourceUri = await this.dwollaClient.createFundingSource(
                profile.dwollaUri,
                parsedData['routingNumber'],
                parsedData['accountNumber'],
                'checking',
                'default',
            );

            profile.dwollaRouting = parsedData['routingNumber'];
            profile.dwollaAccount = parsedData['accountNumber'];

            const sourceInfo = {
                sourceUri: profile.dwollaSourceUri,
                routing: profile.dwollaRouting,
                account: profile.dwollaAccount,
            };

            try {
                await this.mailer.sendFundingSourceRemoved(user, sourceInfo);
            } catch (e) {
                this.logger.error(e);
            }

            await this.service.profileService.update(profile);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }
    }


    @DELETE
    @Path(':id/fundingSource')
    @Preprocessor(BaseController.requireAdmin)
    async deleteUserFundingSource(@PathParam('id') id: string) {
        const user = await this.service.get(id);
        if (!user) {
            throw new Errors.NotFoundError();
        }

        const profile = user.tenantProfile;

        try {
            const sourceInfo = {
                sourceUri: profile.dwollaSourceUri,
                routing: profile.dwollaRouting,
                account: profile.dwollaAccount,
            };

            await this.dwollaClient.authorize();
            await this.dwollaClient.deleteFundingSource(profile.dwollaSourceUri);
            profile.dwollaSourceUri = null;
            profile.dwollaRouting = null;
            profile.dwollaAccount = null;

            try {
                await this.mailer.sendFundingSourceRemoved(user, sourceInfo);
            } catch (e) {
                this.logger.error(e);
            }

            await this.service.profileService.update(profile);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }
    }

    @PATCH
    @Path(':id/profile')
    @Preprocessor(BaseController.requireAdmin)
    async patchAnyUser(@PathParam('id') id: string, data: models.UserRequest): Promise<ProfileResponse> {
        const parsedData = await this.validate(data, models.userPatchSchema);
        ProfileService.validateAge(parsedData['profile']);
        try {
            const user = await this.service.get(id);
            if (!user) {
                throw new Errors.NotFoundError();
            }
            const profile = user.tenantProfile;
            profile.$set(parsedData['profile']);
            const updatedProfile = await this.service.profileService.updateWithDwolla(profile);
            return this.map(ProfileResponse, updatedProfile);
        } catch (e) {
            this.logger.error(e);
            if (e instanceof HttpError) {
                throw e;
            }
            throw new Errors.InternalServerError(e);
        }
    }

    @DELETE
    @Path('')
    async deleteSelf() {
        try {
            await this.service.deleteFull(this.userContext.get().id);
        } catch (e) {
            this.logger.error(e);
            throw new Errors.InternalServerError(e);
        }
    }

    @DELETE
    @Path(':id')
    async delete(@PathParam('id') id: string) {
        const user = await this.service.get(id);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        const hasUnpaidTransactions = await this.service.hasUnpaidTransactions(id);
        if (hasUnpaidTransactions) {
            throw new Errors.ConflictError('User have unprocessed transactions');
        }

        try {
            await this.service.delete(user);
        } catch (e) {
            this.logger.error(e);
            throw new Errors.InternalServerError(e);
        }
    }

    @GET
    @Path(':id/transactions')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('transactions')
    async getUserTransactions(@PathParam('id') userId: string,
                              @QueryParam('page') page?: number,
                              @QueryParam('limit') limit?: number,
                              @QueryParam('startDate') startDate?: Date,
                              @QueryParam('endDate') endDate?: Date,
                              @QueryParam('status') status?: string): Promise<transactions.PaginatedTransactionResponse> {
        const filter = builder => {
            transactions.Transaction.filter(builder, startDate, endDate, status, userId);
        };

        const transactionsList = await this.transactionService.list(page, limit, filter);

        return this.paginate(
            transactionsList.pagination,
            transactionsList.rows.map(transaction => {
                return this.map(transactions.TransactionResponse, transaction);
            }),
        );
    }

    @GET
    @Path(':id/statistics')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('statistics')
    async getJobs(@PathParam('id') userId: string,
                  @QueryParam('currentStartDate') currentStartDate?: string,
                  @QueryParam('currentEndDate') currentEndDate?: string,
                  @QueryParam('previousStartDate') previousStartDate?: string,
                  @QueryParam('previousEndDate') previousEndDate?: string): Promise<models.UserStatisticsResponse> {
        const statistics = await this.service.statsForUser({
            userId,
            currentStartDate,
            currentEndDate,
            previousStartDate,
            previousEndDate,
        });
        return this.map(models.UserStatisticsResponse, statistics);
    }

    @POST
    @Path(':id/documents')
    async createUserDocument(@PathParam('id') userId: string,
                             @QueryParam('type') type: string,
                             @FileParam('file') file, @ContextRequest context: ServiceContext): Promise<models.UserDocument> {
        if (!file) {
            throw new Errors.NotAcceptableError('File missing');
        }

        if (!_.has(dwolla.documents.TYPE, type)) {
            throw new Errors.ConflictError('Invalid type');
        }

        try {
            const user = await this.service.get(userId);
            if (!user) {
                throw new Errors.NotFoundError('User not found');
            }

            if (user.tenantProfile.externalStatus != dwolla.customer.CUSTOMER_STATUS.Document) {
                throw new Errors.NotAcceptableError('User cannot upload documents');
            }

            await this.dwollaClient.authorize();
            const location = await this.dwollaClient.createDocument(user.tenantProfile.dwollaUri, file.buffer, file.originalname, type);
            const doc = await this.dwollaClient.getDocument(location);
            return this.map(models.UserDocument, doc);
        } catch (e) {
            this.logger.error(e.message);
            throw new Errors.InternalServerError(e);
        }
    }

    @GET
    @Path(':id/documents')
    async getUserDocuments(@PathParam('id') userId: string): Promise<Array<models.UserDocument>> {
        try {
            const user = await this.service.get(userId);
            if (!user) {
                throw new Errors.NotFoundError('User not found');
            }

            await this.dwollaClient.authorize();
            const docs = await this.dwollaClient.listDocuments(user.tenantProfile.dwollaUri);

            return docs.map((doc) => {
                return this.map(models.UserDocument, doc);
            });
        } catch (e) {
            this.logger.error(e.message);
            throw new Errors.InternalServerError(e);
        }
    }

    async sendNotificationForDwollaCustomer(user: models.User, status: string) {
        try {
            switch (status) {
                case dwolla.customer.CUSTOMER_STATUS.Retry:
                    await this.mailer.sendCustomerVerificationRetry(user, user);
                    break;
                case dwolla.customer.CUSTOMER_STATUS.Document:
                    await this.mailer.sendCustomerVerificationDocument(user, user);
                    break;
                case dwolla.customer.CUSTOMER_STATUS.Suspended:
                    await this.mailer.sendCustomerVerificationSuspended(user, user);
                    break;
            }
        } catch (e) {
            this.logger.error(e.message);
        }
    }
}
