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
import * as _ from 'lodash';
import {Inject} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';

import {UserService} from './service';
import {ProfileService} from '../profile/service';
import {TransactionService} from '../transaction/service';
import * as dwolla from '../dwolla';
import {BaseController} from '../api';
import * as transactions from '../transaction/models';
import {ProfileResponse} from '../profile/models';
import * as dto from './dto';
import {SearchCriteria} from './models';
import * as documents from './document/models';
import {AddContractorOnRetryStatusLogic} from '../contractor/logic';
import {
    AddContractorUserLogic,
    RatingJobsListLogic,
    UsersListLogic,
    DeleteUserLogic,
    UserStatisticsLogic,
    CreatePasswordResetLogic,
    AddAdminUserLogic,
    GetUserLogic,
} from './logic';
import {
    AddUserDocumentLogic,
    GetUserDocumentsLogic,
    AddUserDwollaDocumentLogic,
    DeleteUserDocumentLogic,
    GetUserDocumentDownloadLinkLogic,
} from './document/logic';
import {
    CreateContractorInvitationLogic,
    CreateAdminInvitationLogic,
    ResendInvitationLogic,
    DeleteInvitationLogic,
} from '../invitation/logic';

@Security('api_key')
@Path('/users')
@Tags('users')
export class UserController extends BaseController {
    @Inject private userService: UserService;
    @Inject private profileService: ProfileService;
    @Inject private transactionService: TransactionService;

    @GET
    @Path('myself')
    async getContractor(): Promise<dto.UserResponse> {
        const logic = new GetUserLogic(this.getRequestContext());
        const user = await logic.execute(this.getRequestContext().getUserId());

        return this.map(dto.UserResponse, user);
    }

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdminReader)
    async getUser(@PathParam('id') id: string): Promise<dto.UserResponse> {
        const logic = new GetUserLogic(this.getRequestContext());
        const user = await logic.execute(id);

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
    @Path('rating/jobs')
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
    ): Promise<dto.PaginatedRankingJobsResponse> {
        const dates: any = await this.validate({startDate, endDate}, dto.rankingRequestSchema);
        const logic = new RatingJobsListLogic(this.getRequestContext());

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
                return this.map(dto.RankingJobsResponse, ranking);
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
        const logic = new UsersListLogic(this.getRequestContext());
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

    @PATCH
    @Path(':id/profile')
    @Preprocessor(BaseController.requireAdmin)
    async patchAnyUser(@PathParam('id') id: string, data: dto.UserPatchRequest): Promise<ProfileResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        this.profileService.setRequestContext(this.getRequestContext());

        const parsedData = await this.validate(data, dto.userPatchSchema);

        try {
            const user = await this.userService.get(id);
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
        this.userService.setRequestContext(this.getRequestContext());

        try {
            await this.userService.deleteFull(this.getRequestContext().getUserId());
        } catch (e) {
            throw new Errors.InternalServerError(e);
        }
    }

    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async delete(@PathParam('id') id: string) {
        const logic = new DeleteUserLogic(this.getRequestContext());
        await logic.execute(id);
    }

    @GET
    @Path(':userId/transactions')
    @Preprocessor(BaseController.requireAdminReader)
    @Tags('transactions')
    async getUserTransactions(
        @PathParam('userId') userId: string,
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
    @Path(':userId/statistics')
    @Preprocessor(BaseController.requireAdminReader)
    @Tags('statistics')
    async getJobs(
        @PathParam('userId') userId: string,
        @QueryParam('currentStartDate') currentStartDate: string,
        @QueryParam('currentEndDate') currentEndDate: string,
        @QueryParam('previousStartDate') previousStartDate: string,
        @QueryParam('previousEndDate') previousEndDate: string,
    ): Promise<dto.UserStatisticsResponse> {
        const logic = new UserStatisticsLogic(this.getRequestContext());
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

    /**
     * Endpoint to create a new admin user account
     *
     * @param {dto.AdminUserRequest} data
     * @returns {Promise<dto.UserResponse>}
     * @memberof UserController
     */
    @POST
    @Path('admins')
    @Preprocessor(BaseController.requireAdmin)
    async createAdminUser(data: dto.AdminUserRequest): Promise<dto.UserResponse> {
        const parsedData: dto.AdminUserRequest = await this.validate(data, dto.adminUserRequestSchema);
        const logic = new AddAdminUserLogic(this.getRequestContext());
        const user = await logic.execute(parsedData.profile, parsedData.profile.role);

        const invitationLogic = new CreateAdminInvitationLogic(this.getRequestContext());
        await invitationLogic.execute(user.tenantProfile);

        return this.map(dto.UserResponse, user);
    }

    /**
     * Endpoint to create a new contractor user
     *
     * @param {dto.AddContractorUserRequest} data
     * @returns {Promise<dto.AddContractorUserResponse>}
     * @memberof UserController
     */
    @POST
    @Path('contractors')
    @Preprocessor(BaseController.requireAdmin)
    async addContractorUser(data: dto.AddContractorUserRequest): Promise<dto.AddContractorUserResponse> {
        const parsedData: dto.AddContractorUserRequest = await this.validate(data, dto.addContractorUserRequestSchema);
        const logic = new AddContractorUserLogic(this.getRequestContext());
        const user = await logic.execute(parsedData.profile);

        const invitationLogic = new CreateContractorInvitationLogic(this.getRequestContext());
        await invitationLogic.execute(user.tenantProfile);

        return this.map(dto.AddContractorUserResponse, user);
    }

    @PUT
    @Path(':userId')
    @Preprocessor(BaseController.requireAdmin)
    async addContractorOnRetry(
        @PathParam('userId') userId: string,
        data: dto.ContractorOnRetryRequest,
    ): Promise<dto.ContractorOnRetryResponse> {
        this.userService.setRequestContext(this.getRequestContext());
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

    /**
     * Endpoint to resend a user's invitation
     *
     * @requires {role} admin
     * @param {string} userId
     * @memberof InvitationController
     */
    @PUT
    @Path(':userId/invitations/resend')
    @Preprocessor(BaseController.requireAdmin)
    async resendInvitation(@PathParam('userId') userId: string) {
        const logic = new ResendInvitationLogic(this.getRequestContext());
        await logic.execute(userId);
    }

    /**
     * Endpoint to delete a user's invitation
     *
     * @requires {role} admin
     * @param {string} userId
     * @memberof InvitationController
     */
    @DELETE
    @Path(':userId/invitations')
    @Preprocessor(BaseController.requireAdmin)
    async deleteInvitation(@PathParam('userId') userId: string) {
        const logic = new DeleteInvitationLogic(this.getRequestContext());
        await logic.execute(userId);
    }

    /**
     * Endpoint to initiate a password reset for a user
     *
     * creates a temporary password reset token and
     * sends and email to the user the reset link
     *
     * @param {string} userId
     * @returns {Promise<any>}
     * @memberof UserController
     */
    @POST
    @Path(':userId/passwordReset')
    @Preprocessor(BaseController.requireAdmin)
    async createUserPasswordReset(@PathParam('userId') userId: string): Promise<any> {
        const logic = new CreatePasswordResetLogic(this.getRequestContext());
        await logic.execute(userId);
    }

    /**
     * Endpoint to upload a document to dwolla for validation
     *
     * @param {string} userId
     * @param {string} type
     * @param {*} file
     * @returns {Promise<dto.UserDocument>}
     * @memberof UserController
     */
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

        return this.map(documents.UserDocumentResponse, document);
    }

    /**
     * Endpoint to upload a new user document
     *
     * @param {string} userId
     * @param {string} type
     * @param {*} file
     * @returns {Promise<dto.UserDocument>}
     * @memberof UserController
     */
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

        return this.map(documents.UserDocumentResponse, document);
    }

    /**
     * Endpoint to get a list of a user's documents
     *
     * @param {string} userId
     * @param {string} [type]
     * @param {number} [page]
     * @param {number} [limit]
     * @returns {Promise<documents.PaginatedUserDocumentResponse>}
     * @memberof UserController
     */
    @GET
    @Path(':userId/documents')
    @Preprocessor(BaseController.requireAdminReader)
    async getUserDocuments(
        @PathParam('userId') userId: string,
        @QueryParam('type') type?: string,
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
    ): Promise<documents.PaginatedUserDocumentResponse> {
        const logic = new GetUserDocumentsLogic(this.getRequestContext());
        const documentsList = await logic.execute(userId, type, page, limit);

        return this.paginate(
            documentsList.pagination,
            documentsList.rows.map(document => {
                return this.map(documents.UserDocumentResponse, document);
            }),
        );
    }

    /**
     * Enpoint to delete a document
     *
     * @param {string} id
     * @memberof UserController
     */
    @DELETE
    @Path('documents/:id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteUserDocument(@PathParam('id') id: string) {
        const logic = new DeleteUserDocumentLogic(this.getRequestContext());
        await logic.execute(id);
    }

    /**
     * Endpoint to create a download link for a document
     *
     * @param {string} id
     * @returns {Promise<string>}
     * @memberof UserController
     */
    @GET
    @Path('documents/:id')
    async getDocumentDownloadLink(@PathParam('id') id: string): Promise<string> {
        const logic = new GetUserDocumentDownloadLinkLogic(this.getRequestContext());
        return await logic.execute(id);
    }
}
