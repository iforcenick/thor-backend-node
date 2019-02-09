import * as _ from 'lodash';
import {Inject} from 'typescript-ioc';
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
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import * as dto from './dto';
import * as dwolla from '../dwolla';
import {AddContractorOnRetryStatusLogic} from '../contractor/logic';
import * as usersLogic from './logic';
import * as documentsLogic from '../document/logic';
import * as invitationsLogic from '../invitation/logic';
import * as transactions from '../transaction/models';
import {ProfileResponse} from '../profile/models';
import {SearchCriteria} from './models';
import * as documents from '../document/models';
import {UserService} from './service';
import {ProfileService} from '../profile/service';
import {TransactionService} from '../transaction/service';

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
        const logic = new usersLogic.GetUserLogic(this.getRequestContext());
        const user = await logic.execute(this.getRequestContext().getUserId());
        return this.map(dto.UserResponse, user);
    }

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdminReader)
    async getUser(@PathParam('id') id: string): Promise<dto.UserResponse> {
        const logic = new usersLogic.GetUserLogic(this.getRequestContext());
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
        const logic = new usersLogic.RatingJobsListLogic(this.getRequestContext());

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
        const logic = new usersLogic.UsersListLogic(this.getRequestContext());
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
            const profileData = parsedData['profile'];
            user.tenantProfile.merge(profileData);
            const updatedProfile = await this.profileService.update(user.tenantProfile);
            updatedProfile.roles = user.tenantProfile.roles;
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
        const logic = new usersLogic.DeleteUserLogic(this.getRequestContext());
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
        const logic = new usersLogic.UserStatisticsLogic(this.getRequestContext());
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
        const logic = new usersLogic.AddAdminUserLogic(this.getRequestContext());
        const user = await logic.execute(parsedData.profile, parsedData.profile.role);

        const invitationLogic = new invitationsLogic.CreateAdminInvitationLogic(this.getRequestContext());
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
        const logic = new usersLogic.AddContractorUserLogic(this.getRequestContext());
        const user = await logic.execute(parsedData.profile);

        const invitationLogic = new invitationsLogic.CreateContractorInvitationLogic(this.getRequestContext());
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
        const logic = new invitationsLogic.ResendInvitationLogic(this.getRequestContext());
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
        const logic = new invitationsLogic.DeleteInvitationLogic(this.getRequestContext());
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
        const logic = new usersLogic.CreatePasswordResetLogic(this.getRequestContext());
        await logic.execute(userId);
    }

    /**
     * Upload a user's document to dwolla for validation
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
    ): Promise<documents.DocumentResponse> {
        const logic = new documentsLogic.AddDwollaDocumentLogic(this.getRequestContext());
        const document = await logic.execute(userId, type, file);

        return this.map(documents.DocumentResponse, document);
    }

    /**
     * Upload a user's document
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
    ): Promise<documents.DocumentResponse> {
        const logic = new documentsLogic.AddDocumentLogic(this.getRequestContext());
        const document = await logic.execute(userId, type, file);

        return this.map(documents.DocumentResponse, document);
    }

    /**
     * Get a list of a user's documents
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
    ): Promise<documents.PaginatedDocumentResponse> {
        const logic = new documentsLogic.GetDocumentsLogic(this.getRequestContext());
        const documentsList = await logic.execute(userId, type, page, limit);

        return this.paginate(
            documentsList.pagination,
            documentsList.rows.map(document => {
                return this.map(documents.DocumentResponse, document);
            }),
        );
    }

    /**
     * Delete a user's document
     *
     * @param {string} id
     * @memberof UserController
     */
    @DELETE
    @Path('documents/:id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteUserDocument(@PathParam('id') id: string) {
        const logic = new documentsLogic.DeleteDocumentLogic(this.getRequestContext());
        await logic.execute(id);
    }

    /**
     * Get a download link for a user's document
     *
     * @param {string} id
     * @returns {Promise<string>}
     * @memberof UserController
     */
    @GET
    @Path('documents/:id')
    @Preprocessor(BaseController.requireAdmin)
    async getDocumentDownloadLink(@PathParam('id') id: string): Promise<string> {
        const logic = new documentsLogic.GetDocumentDownloadLinkLogic(this.getRequestContext());
        return await logic.execute(id);
    }
}
