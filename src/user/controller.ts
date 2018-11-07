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
import {Inject} from 'typescript-ioc';
import {UserService} from './service';
import * as models from './models';
import {Profile, ProfileResponse} from '../profile/models';
import {ProfileService} from '../profile/service';
import {Security, Tags} from 'typescript-rest-swagger';
import * as dwolla from '../dwolla';
import * as transactions from '../transaction/models';
import {TransactionService} from '../transaction/service';
import {MailerService} from '../mailer';
import * as _ from 'lodash';
import {DwollaNotifier} from '../dwolla/notifier';
import {AddContractorLogic} from "../contractor/logic";

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
    async getUser(@PathParam('id') id: string): Promise<models.UserResponse> {
        this.service.setRequestContext(this.getRequestContext());

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
        this.service.setRequestContext(this.getRequestContext());

        const dates: any = await this.validate({startDate, endDate}, models.rankingRequestSchema);
        const users: any = await this.service.getJobsRanking(dates.startDate, dates.endDate, page, limit, status);

        return this.paginate(
            users.pagination,
            users.rows.map(user => {
                user.transactionsIds = user.ids.split(',');
                user.jobsCount = user.transactions.length;
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
        this.service.setRequestContext(this.getRequestContext());

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
        this.service.setRequestContext(this.getRequestContext());

        const parsedData: models.UserRequest = await this.validate(data, models.userRequestSchema);
        ProfileService.validateAge(parsedData.profile);

        let user = null;

        try {
            const logic = new AddContractorLogic(this.getRequestContext());
            user = await logic.execute(parsedData.profile, this.getRequestContext().getTenantId(), parsedData.password);
         } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError('profile');
            }
        }

        return this.map(models.UserResponse, user);
    }

    @PATCH
    @Path(':id/profile')
    @Preprocessor(BaseController.requireAdmin)
    async patchAnyUser(@PathParam('id') id: string, data: models.UserPatchRequest): Promise<ProfileResponse> {
        this.service.setRequestContext(this.getRequestContext());
        this.profileService.setRequestContext(this.getRequestContext());

        const parsedData = await this.validate(data, models.userPatchSchema);
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
        this.service.setRequestContext(this.getRequestContext());

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

            await this.dwollaClient.authorize();
            const location = await this.dwollaClient.createDocument(user.tenantProfile.dwollaUri, file.buffer, file.originalname, type);
            const doc = await this.dwollaClient.getDocument(location);
            return this.map(models.UserDocument, doc);
        } catch (e) {
            throw new Errors.InternalServerError(e);
        }
    }

    @GET
    @Path(':id/documents')
    async getUserDocuments(@PathParam('id') userId: string): Promise<Array<models.UserDocument>> {
        this.service.setRequestContext(this.getRequestContext());

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
            throw new Errors.InternalServerError(e);
        }
    }
}
