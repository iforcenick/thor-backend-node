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
    PUT,
    QueryParam,
    ServiceContext,
} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import {UserService} from './service';
import {ProfileResponse} from '../profile/models';
import {ProfileService} from '../profile/service';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import * as transactions from '../transaction/models';
import {TransactionService} from '../transaction/service';
import {MailerService} from '../mailer';
import * as _ from 'lodash';
import {DwollaNotifier} from '../dwolla/notifier';
import {AddContractorLogic, AddContractorOnRetryStatusLogic} from '../contractor/logic';
import {RatingJobsListLogic, SearchCriteria, UsersListLogic, UserStatisticsLogic} from './logic';
import {
    ContractorOnRetryRequest, contractorOnRetryRequestSchema, ContractorOnRetryResponse,
    PaginatedRankingJobs, PaginatedUserResponse,
    RankingJobs,
    rankingRequestSchema, statisticsRequestSchema, UserDocument, UserPatchRequest, userPatchSchema,
    UserRequest,
    userRequestSchema,
    UserResponse, UserStatisticsResponse
} from './dto';


@Security('api_key')
@Path('/users')
@Tags('users')
export class UserController extends BaseController {
    @Inject private mailer: MailerService;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private service: UserService;
    @Inject private profileService: ProfileService;
    @Inject private transactionService: TransactionService;
    @Inject private dwollaNotifier: DwollaNotifier;

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async getUser(@PathParam('id') id: string): Promise<UserResponse> {
        this.service.setRequestContext(this.getRequestContext());

        const user = await this.service.get(id);

        if (!user) {
            throw new Errors.NotFoundError();
        }

        return this.map(UserResponse, user);
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     * @param startDate startDate
     * @param endDate endDate
     * @param status status
     * @param orderBy - field name
     * @param order - asc|desc
     * @param contractor - contractor firstName, lastName or "firstName lastName"
     */
    @GET
    @Path('/rating/jobs')
    @Preprocessor(BaseController.requireAdmin)
    async getRatingJobsList(@QueryParam('startDate') startDate: Date,
                            @QueryParam('endDate') endDate: Date,
                            @QueryParam('limit') limit?: number,
                            @QueryParam('page') page?: number,
                            @QueryParam('status') status?: string,
                            @QueryParam('orderBy') orderBy?: string,
                            @QueryParam('order') order?: string,
                            @QueryParam('contractor') contractor?: string): Promise<PaginatedRankingJobs> {
        const dates: any = await this.validate({startDate, endDate}, rankingRequestSchema);
        const logic = new RatingJobsListLogic(this.getRequestContext());

        const rankings = await logic.execute(dates.startDate, dates.endDate, page, limit, status, orderBy, order, contractor);

        return this.paginate(
            rankings.pagination,
            rankings.rows.map(ranking => {
                return this.map(RankingJobs, ranking);
            }),
        );
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit users per page
     * @param orderBy - field name
     * @param order - asc|desc
     * @param contractor - contractor firstName, lastName or "firstName lastName"
     * @param filterColumnName - profile state or city
     * @param filterValue - profile state value or city value
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async getUsersList(@QueryParam('page') page?: number,
                       @QueryParam('limit') limit?: number,
                       @QueryParam('orderBy') orderBy?: string,
                       @QueryParam('order') order?: string,
                       @QueryParam('contractor') contractor?: string,
                       @QueryParam('filterColumnName') filterColumnName?: string,
                       @QueryParam('filterValue') filterValue?: string,
        ): Promise<PaginatedUserResponse> {
        const logic = new UsersListLogic(this.getRequestContext());
        const searchCriteria = new SearchCriteria();
        searchCriteria.page = page;
        searchCriteria.limit = limit;
        searchCriteria.orderBy = orderBy;
        searchCriteria.order = order;
        searchCriteria.contractor = contractor;
        searchCriteria.filterColumnName = filterColumnName;
        searchCriteria.filterValue = filterValue;

        const users = await logic.execute(searchCriteria);

        return this.paginate(
            users.pagination,
            users.rows.map(user => {
                return this.map(UserResponse, user);
            }),
        );
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createUser(data: UserRequest): Promise<UserResponse> {
        this.service.setRequestContext(this.getRequestContext());

        const parsedData: UserRequest = await this.validate(data, userRequestSchema);
        ProfileService.validateAge(parsedData.profile);

        try {
            const logic = new AddContractorLogic(this.getRequestContext());
            const user = await logic.execute(parsedData.profile, this.getRequestContext().getTenantId(), parsedData.password);
            return this.map(UserResponse, user);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError('profile');
            }

            throw err;
        }
    }

    @PATCH
    @Path(':id/profile')
    @Preprocessor(BaseController.requireAdmin)
    async patchAnyUser(@PathParam('id') id: string, data: UserPatchRequest): Promise<ProfileResponse> {
        this.service.setRequestContext(this.getRequestContext());
        this.profileService.setRequestContext(this.getRequestContext());

        const parsedData = await this.validate(data, userPatchSchema);
        ProfileService.validateAge(parsedData['profile']);

        try {
            const user = await this.service.get(id);
            if (!user) {
                throw new Errors.NotFoundError();
            }

            const profile = user.tenantProfile;
            if (!profile.dwollaUpdateAvailable()) {
                throw new Errors.NotAcceptableError('User not in a proper state for modification');
            }

            profile.$set(parsedData['profile']);
            const updatedProfile = await this.profileService.updateWithDwolla(profile);
            updatedProfile.roles = profile.roles;
            return this.map(ProfileResponse, updatedProfile);
        } catch (e) {
            if (e instanceof HttpError) {
                throw e;
            }

            if (e instanceof dwolla.DwollaRequestError) {
                throw e.toValidationError('profile');
            }

            throw new Errors.InternalServerError(e);
        }
    }

    @DELETE
    @Path('')
    async deleteSelf() {
        this.service.setRequestContext(this.getRequestContext());

        try {
            await this.service.deleteFull(this.getRequestContext().getUser().id);
        } catch (e) {
            throw new Errors.InternalServerError(e);
        }
    }

    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async delete(@PathParam('id') id: string) {
        this.service.setRequestContext(this.getRequestContext());

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
        this.transactionService.setRequestContext(this.getRequestContext());

        const filter = builder => {
            transactions.Transaction.filter(builder, startDate, endDate, status, userId);
        };

        const transactionsList = await this.transactionService.listPaginated(page, limit, filter);

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
                  @QueryParam('currentStartDate') currentStartDate: string,
                  @QueryParam('currentEndDate') currentEndDate: string,
                  @QueryParam('previousStartDate') previousStartDate: string,
                  @QueryParam('previousEndDate') previousEndDate: string): Promise<UserStatisticsResponse> {
        const logic = new UserStatisticsLogic(this.getRequestContext());
        const parsed = await this.validate({
            currentStartDate,
            currentEndDate,
            previousStartDate,
            previousEndDate
        }, statisticsRequestSchema);

        const statistics = await logic.execute(
            userId,
            parsed.currentStartDate,
            parsed.currentEndDate,
            parsed.previousStartDate,
            parsed.previousEndDate,
        );
        return this.map(UserStatisticsResponse, statistics);
    }

    @POST
    @Path(':id/documents')
    async createUserDocument(@PathParam('id') userId: string,
                             @QueryParam('type') type: string,
                             @FileParam('filepond') file, @ContextRequest context: ServiceContext): Promise<UserDocument> {
        this.service.setRequestContext(this.getRequestContext());

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

            const location = await this.dwollaClient.createDocument(user.tenantProfile.dwollaUri, file.buffer, file.originalname, type);
            const doc = await this.dwollaClient.getDocument(location);
            return this.map(UserDocument, doc);
        } catch (e) {
            throw new Errors.InternalServerError(e);
        }
    }

    @GET
    @Path(':id/documents')
    async getUserDocuments(@PathParam('id') userId: string): Promise<Array<UserDocument>> {
        this.service.setRequestContext(this.getRequestContext());

        try {
            const user = await this.service.get(userId);
            if (!user) {
                throw new Errors.NotFoundError('User not found');
            }

            const docs = await this.dwollaClient.listDocuments(user.tenantProfile.dwollaUri);

            return docs.map((doc) => {
                return this.map(UserDocument, doc);
            });
        } catch (e) {
            throw new Errors.InternalServerError(e);
        }
    }

    @PUT
    @Path('/:userId')
    async addContractorOnRetry(@PathParam('userId') userId: string, data: ContractorOnRetryRequest): Promise<ContractorOnRetryResponse> {
        this.service.setRequestContext(this.getRequestContext());
        const parsedData = await this.validate(data, contractorOnRetryRequestSchema);
        const profile = parsedData['profile'];
        ProfileService.validateAge(profile);
        try {
            const logic = new AddContractorOnRetryStatusLogic(this.getRequestContext());
            const tenantId = this.getRequestContext().getTenantId();
            const user = await logic.execute(profile, tenantId, userId);

            return this.map(ContractorOnRetryResponse, user);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError('profile');
            }
            throw err;
        }
    }
}
