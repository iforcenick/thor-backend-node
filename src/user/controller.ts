import {
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
import * as logicLayer from './logic';
import * as dto from './dto';
import {SearchCriteria} from './models';
import {UserDocumentResponse, PaginatedUserDocumentResponse} from './document/models';
import {
    AddUserDocumentLogic,
    GetUserDocumentsLogic,
    AddUserDwollaDocumentLogic,
    DeleteUserDocumentLogic,
    GetUserDocumentDownloadLinkLogic,
} from './document/logic';

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
    @Preprocessor(BaseController.requireAdminReader)
    async getUser(@PathParam('id') id: string): Promise<dto.UserResponse> {
        this.service.setRequestContext(this.getRequestContext());

        const user = await this.service.get(id);

        if (!user) {
            throw new Errors.NotFoundError();
        }

        return this.map(dto.UserResponse, user);
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
    @Preprocessor(BaseController.requireAdminReader)
    async getRatingJobsList(
        @QueryParam('startDate') startDate: Date,
        @QueryParam('endDate') endDate: Date,
        @QueryParam('limit') limit?: number,
        @QueryParam('page') page?: number,
        @QueryParam('status') status?: string,
        @QueryParam('orderBy') orderBy?: string,
        @QueryParam('order') order?: string,
        @QueryParam('contractor') contractor?: string,
    ): Promise<dto.PaginatedRankingJobs> {
        const dates: any = await this.validate({startDate, endDate}, dto.rankingRequestSchema);
        const logic = new logicLayer.RatingJobsListLogic(this.getRequestContext());

        const rankings = await logic.execute(
            dates.startDate,
            dates.endDate,
            page,
            limit,
            status,
            orderBy,
            order,
            contractor,
        );

        return this.paginate(
            rankings.pagination,
            rankings.rows.map(ranking => {
                return this.map(dto.RankingJobs, ranking);
            }),
        );
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit users per page
     * @param orderBy - field name
     * @param order - asc|desc
     * @param contractor - contractor firstName, lastName or "firstName lastName"
     * @param city
     * @param state
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getUsersList(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('orderBy') orderBy?: string,
        @QueryParam('order') order?: string,
        @QueryParam('contractor') contractor?: string,
        @QueryParam('city') city?: string,
        @QueryParam('state') state?: string,
    ): Promise<dto.PaginatedUserResponse> {
        const logic = new logicLayer.UsersListLogic(this.getRequestContext());
        const searchCriteria = new SearchCriteria();
        searchCriteria.page = page;
        searchCriteria.limit = limit;
        searchCriteria.orderBy = orderBy;
        searchCriteria.order = order;
        searchCriteria.contractor = contractor;
        searchCriteria.city = city;
        searchCriteria.state = state;

        const users = await logic.execute(searchCriteria);

        return this.paginate(
            users.pagination,
            users.rows.map(user => {
                return this.map(dto.UserResponse, user);
            }),
        );
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createUser(data: dto.UserRequest): Promise<dto.UserResponse> {
        const parsedData: dto.UserRequest = await this.validate(data, dto.userRequestSchema);

        try {
            const logic = new AddContractorLogic(this.getRequestContext());
            const user = await logic.execute(
                parsedData.profile,
                this.getRequestContext().getTenantId(),
                parsedData.password,
            );
            return this.map(dto.UserResponse, user);
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
    async patchAnyUser(@PathParam('id') id: string, data: dto.UserPatchRequest): Promise<ProfileResponse> {
        this.service.setRequestContext(this.getRequestContext());
        this.profileService.setRequestContext(this.getRequestContext());

        const parsedData = await this.validate(data, dto.userPatchSchema);

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
            await this.service.deleteFull(this.getRequestContext().getUserId());
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

        const logic = new logicLayer.DeleteUserLogic(this.getRequestContext());
        await logic.execute(user);
    }

    @GET
    @Path(':id/transactions')
    @Preprocessor(BaseController.requireAdminReader)
    @Tags('transactions')
    async getUserTransactions(
        @PathParam('id') userId: string,
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('startDate') startDate?: Date,
        @QueryParam('endDate') endDate?: Date,
        @QueryParam('status') status?: string,
    ): Promise<transactions.PaginatedTransactionResponse> {
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
    @Preprocessor(BaseController.requireAdminReader)
    @Tags('statistics')
    async getJobs(
        @PathParam('id') userId: string,
        @QueryParam('currentStartDate') currentStartDate: string,
        @QueryParam('currentEndDate') currentEndDate: string,
        @QueryParam('previousStartDate') previousStartDate: string,
        @QueryParam('previousEndDate') previousEndDate: string,
    ): Promise<dto.UserStatisticsResponse> {
        const logic = new logicLayer.UserStatisticsLogic(this.getRequestContext());
        const parsed = await this.validate(
            {
                currentStartDate,
                currentEndDate,
                previousStartDate,
                previousEndDate,
            },
            dto.statisticsRequestSchema,
        );

        const statistics = await logic.execute(
            userId,
            parsed.currentStartDate,
            parsed.currentEndDate,
            parsed.previousStartDate,
            parsed.previousEndDate,
        );
        return this.map(dto.UserStatisticsResponse, statistics);
    }

    @PUT
    @Path('/:userId')
    @Preprocessor(BaseController.requireAdmin)
    async addContractorOnRetry(
        @PathParam('userId') userId: string,
        data: dto.ContractorOnRetryRequest,
    ): Promise<dto.ContractorOnRetryResponse> {
        this.service.setRequestContext(this.getRequestContext());
        const parsedData = await this.validate(data, dto.contractorOnRetryRequestSchema);
        const profile = parsedData['profile'];

        try {
            const logic = new AddContractorOnRetryStatusLogic(this.getRequestContext());
            const tenantId = this.getRequestContext().getTenantId();
            const user = await logic.execute(profile, tenantId, userId);

            return this.map(dto.ContractorOnRetryResponse, user);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError('profile');
            }
            throw err;
        }
    }

    @POST
    @Path('/:userId/passwordReset')
    @Preprocessor(BaseController.requireAdmin)
    async createUserPasswordReset(@PathParam('userId') userId: string): Promise<any> {
        const logic = new logicLayer.CreatePasswordResetLogic(this.getRequestContext());
        await logic.execute(userId);
    }

    @POST
    @Path('/admin')
    @Preprocessor(BaseController.requireAdmin)
    /**
     * Allowed roles: admin, adminReader
     */
    async createAdminUser(data: dto.AdminUserRequest): Promise<dto.UserResponse> {
        const parsedData: dto.AdminUserRequest = await this.validate(data, dto.adminUserRequestSchema);
        const logic = new logicLayer.AddAdminUserLogic(this.getRequestContext());
        const user = await logic.execute(
            parsedData.profile.email,
            parsedData.profile.firstName,
            parsedData.profile.lastName,
            parsedData.password,
            parsedData.profile.role,
        );

        return this.map(dto.UserResponse, user);
    }

    @POST
    @Path(':userId/documents/dwolla')
    @Preprocessor(BaseController.requireAdmin)
    async addUserDwollaDocument(
        @PathParam('userId') userId: string,
        @QueryParam('type') type: string,
        @FileParam('filepond') file,
    ): Promise<dto.UserDocument> {
        const logic = new AddUserDwollaDocumentLogic(this.getRequestContext());
        const document = await logic.execute(userId, type, file);

        return this.map(UserDocumentResponse, document);
    }

    @POST
    @Path(':userId/documents')
    @Preprocessor(BaseController.requireAdminReader)
    async addUserDocument(
        @PathParam('userId') userId: string,
        @QueryParam('type') type: string,
        @FileParam('filepond') file,
    ): Promise<dto.UserDocument> {
        const logic = new AddUserDocumentLogic(this.getRequestContext());
        const document = await logic.execute(userId, type, file);

        return this.map(UserDocumentResponse, document);
    }

    @GET
    @Path(':userId/documents')
    @Preprocessor(BaseController.requireAdminReader)
    async getUserDocuments(
        @PathParam('userId') userId: string,
        @QueryParam('type') type?: string,
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
    ): Promise<PaginatedUserDocumentResponse> {
        const logic = new GetUserDocumentsLogic(this.getRequestContext());
        const contractorDocumentsList = await logic.execute(userId, type, page, limit);

        return this.paginate(
            contractorDocumentsList.pagination,
            contractorDocumentsList.rows.map(document => {
                return this.map(UserDocumentResponse, document);
            }),
        );
    }

    @DELETE
    @Path('/documents/:id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteUserDocument(@PathParam('id') id: string) {
        const logic = new DeleteUserDocumentLogic(this.getRequestContext());
        await logic.execute(id);
    }

    @GET
    @Path('/documents/:id')
    async getDocumentDownloadLink(@PathParam('id') id: string): Promise<string> {
        const logic = new GetUserDocumentDownloadLinkLogic(this.getRequestContext());
        return await logic.execute(id);
    }
}
