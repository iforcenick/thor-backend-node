import {
    Errors,
    GET,
    Path,
    PATCH,
    PathParam,
    POST,
    Preprocessor,
    QueryParam,
    ContextRequest,
    ServiceContext,
    DELETE,
    HttpError,
} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import {UserService} from './service';
import * as models from './models';
import {Profile, ProfileResponse} from '../profile/models';
import {ProfileService} from '../profile/service';
import {transaction} from 'objection';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import {ValidationError} from '../errors';
import {TransactionResponse, PaginatedTransactionResponse} from '../transaction/models';
import {TransactionService} from '../transaction/service';

@Security('api_key')
@Path('/users')
@Tags('users')
export class UserController extends BaseController {
    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;
    private service: UserService;
    private profileService: ProfileService;
    private transactionService: TransactionService;

    constructor(@Inject service: UserService,
                @Inject profileService: ProfileService,
                @Inject transactionService: TransactionService) {
        super();
        this.service = service;
        this.profileService = profileService;
        this.transactionService = transactionService;
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
     * @param startDate startDate
     * @param endDate endDate
     * @param status status
     */
    @GET
    @Path('/rating/period')
    @Preprocessor(BaseController.requireAdmin)
    async getRatingPeriodList(@QueryParam('startDate') startDate: string,
                              @QueryParam('endDate') endDate: string,
                              @QueryParam('limit') limit?: number,
                              @QueryParam('page') page?: number,
                              @QueryParam('status') status?: string): Promise<models.PaginatedRanking> {
        const dates: any = await this.validate({startDate, endDate}, models.rankingRequestSchema);
        const users: any = await this.service.getRankings(dates.startDate, dates.endDate, page, limit, status);

        return this.paginate(
            users.pagination,
            users.rows.map(user => {
                user['rank'] = parseInt(user['rank']);
                user['total'] = parseFloat(user['total']);
                return this.map(models.Ranking, user);
            }),
        );
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     * @param embed embed
     * @param startDate startDate
     * @param endDate endDate
     * @param status status
     */
    @GET
    @Path('/payments/list')
    @Preprocessor(BaseController.requireAdmin)
    async getUsersPaymentsList(@QueryParam('page') page?: number,
                               @QueryParam('limit') limit?: number,
                               @QueryParam('embed') embed?: string,
                               @QueryParam('startDate') startDate?: string,
                               @QueryParam('endDate') endDate?: string,
                               @QueryParam('status') status?: string): Promise<models.PaginatedUserResponse> {
        let users;
        if (embed) {
            users = await this.service.getWithTransactions(page, limit, embed, startDate, endDate, status);
        } else {
            users = await this.service.listWithPayments(page, limit, startDate, endDate);
        }
        return this.paginate(
            users.pagination,
            users.rows.map(user => {
                return this.map(models.UserResponse, user);
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

        let user = models.User.fromJson({});
        const profile = Profile.fromJson(parsedData['profile']);

        try {
            await this.dwollaClient.authorize();
            const customer = new dwolla.customer.Customer(dwolla.customer.factoryFromProfile(profile));
            delete profile['ssn'];
            profile.dwollaUri = await this.dwollaClient.createCustomer(customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(profile.dwollaUri);
            profile.dwollaStatus = dwollaCustomer.status;

            user = await this.service.createWithProfile(user, profile);
            user = await this.service.get(user.id);
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
            await this.dwollaClient.authorize();
            await this.dwollaClient.deleteFundingSource(profile.dwollaSourceUri);
            profile.dwollaSourceUri = null;
            profile.dwollaRouting = null;
            profile.dwollaAccount = null;
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
    async deleteSelf(@ContextRequest context: ServiceContext) {
        try {
            await this.service.deleteFull(context['user'].id);
        } catch (e) {
            this.logger.error(e);
            throw new Errors.InternalServerError(e);
        }
    }

    @DELETE
    @Path(':id')
    async delete(@PathParam('id') id: string, @ContextRequest context: ServiceContext) {
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
                              @QueryParam('startDate') startDate?: string,
                              @QueryParam('endDate') endDate?: string,
                              @QueryParam('status') status?: string): Promise<PaginatedTransactionResponse> {
        const transactions = await this.transactionService.getForUser(
            {page, limit},
            {userId, startDate, endDate, status},
        );

        return this.paginate(
            transactions.pagination,
            transactions.rows.map(transaction => {
                return this.map(TransactionResponse, transaction);
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
}
