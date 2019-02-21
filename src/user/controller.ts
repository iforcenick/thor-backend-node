import * as _ from 'lodash';
import {DELETE, GET, Path, PathParam, POST, Preprocessor, PUT, QueryParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import * as dto from './dto';
import {DwollaRequestError} from '../payment/dwolla';
import {AddContractorOnRetryStatusLogic} from '../contractor/logic';
import * as usersLogic from './logic';
import * as invitationsLogic from '../invitation/logic';
import {SearchCriteria} from './models';

@Security('api_key')
@Path('/users')
@Tags('users')
export class UserController extends BaseController {
    /**
     * Get your user data
     *
     * @returns {Promise<dto.UserResponse>}
     * @memberof UserController
     */
    @GET
    @Path('self')
    async getSelf(): Promise<dto.UserResponse> {
        const logic = new usersLogic.GetUserLogic(this.getRequestContext());
        const user = await logic.execute(this.getRequestContext().getUserId());
        return this.map(dto.UserResponse, user);
    }

    /**
     * Get a user's data
     *
     * @param {string} id
     * @returns {Promise<dto.UserResponse>}
     * @memberof UserController
     */
    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdminReader)
    async getUser(@PathParam('id') id: string): Promise<dto.UserResponse> {
        const logic = new usersLogic.GetUserLogic(this.getRequestContext());
        const user = await logic.execute(id);
        return this.map(dto.UserResponse, user);
    }

    /**
     * Query for a list of contractor's user data and transactions
     *
     * @param page - page to be queried, starting from 0
     * @param limit - transactions per page
     * @param startDate - startDate
     * @param endDate - endDate
     * @param status - status
     * @param orderBy - field|name
     * @param order - asc|desc
     * @param name - firstName, lastName or "firstName lastName"
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
        @QueryParam('name') name?: string,
    ): Promise<dto.PaginatedRankingJobsResponse> {
        const dates: any = await this.validate({startDate, endDate}, dto.rankingRequestSchema);
        const logic = new usersLogic.RatingJobsListLogic(this.getRequestContext());
        const rankings = await logic.execute(dates.startDate, dates.endDate, page, limit, status, orderBy, order, name);
        return this.paginate(
            rankings.pagination,
            rankings.rows.map(ranking => {
                return this.map(dto.RankingJobsResponse, ranking);
            }),
        );
    }

    /**
     * Query for a list of contractor's user data
     *
     * @param page page to be queried, starting from 0
     * @param limit users per page
     * @param orderBy - field name
     * @param order - asc|desc
     * @param name - firstName, lastName or "firstName lastName"
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
        @QueryParam('name') name?: string,
        @QueryParam('city') city?: string,
        @QueryParam('state') state?: string,
    ): Promise<dto.PaginatedUserResponse> {
        const logic = new usersLogic.UsersListLogic(this.getRequestContext());
        const searchCriteria = new SearchCriteria();
        searchCriteria.page = page;
        searchCriteria.limit = limit;
        searchCriteria.orderBy = orderBy;
        searchCriteria.order = order;
        searchCriteria.name = name;
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

    @DELETE
    @Path('')
    async deleteSelf() {
        const logic = new usersLogic.DeleteSelfLogic(this.getRequestContext());
        await logic.execute(this.getRequestContext().getUserId());
    }

    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteUser(@PathParam('id') id: string) {
        const logic = new usersLogic.DeleteUserLogic(this.getRequestContext());
        await logic.execute(id);
    }

    /**
     * Create a contractor user
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

    /**
     * Create an admin user
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
     * Initiate a password reset for a user
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
}

@Security('api_key')
@Path('/users/:userId/contractors')
@Tags('users', 'contractors')
export class ContractorUserController extends BaseController {
    /**
     * Query for a list of contractor's user data
     *
     * @param {string} userId
     * @param {string} currentStartDate
     * @param {string} currentEndDate
     * @param {string} previousStartDate
     * @param {string} previousEndDate
     * @returns {Promise<dto.UserStatisticsResponse>}
     * @memberof ContractorUserController
     */
    @GET
    @Path('statistics')
    @Preprocessor(BaseController.requireAdminReader)
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
     * Update a contractor's user data to resubmit their payments account
     *
     * @param {string} userId
     * @param {dto.ContractorOnRetryRequest} data
     * @returns {Promise<dto.ContractorOnRetryResponse>}
     * @memberof ContractorUserController
     */
    @PUT
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async addContractorOnRetry(
        @PathParam('userId') userId: string,
        data: dto.ContractorOnRetryRequest,
    ): Promise<dto.ContractorOnRetryResponse> {
        const parsedData = await this.validate(data, dto.contractorOnRetryRequestSchema);
        const profile = parsedData['profile'];

        try {
            const logic = new AddContractorOnRetryStatusLogic(this.getRequestContext());
            const tenantId = this.getRequestContext().getTenantId();
            const user = await logic.execute(profile, tenantId, userId);

            return this.map(dto.ContractorOnRetryResponse, user);
        } catch (err) {
            if (err instanceof DwollaRequestError) {
                throw err.toValidationError('profile');
            }
            throw err;
        }
    }
}
