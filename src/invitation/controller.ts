import * as _ from 'lodash';
import {GET, Path, PathParam, POST, DELETE, Preprocessor, QueryParam, PUT, PATCH} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import * as logicLayer from './logic';
import {AddContractorUserLogic, AddAdminUserLogic} from '../user/logic';
import * as models from './models';

/**
 * Manage contractor and administator invitations
 *
 * @requires api_key
 * @export
 * @class InvitationController
 * @extends {BaseController}
 */
@Security('api_key')
@Path('invitations')
@Tags('invitations')
export class InvitationController extends BaseController {
    /**
     * Query for a list of invitations
     *
     * @requires {role} [admin, adminReader]
     * @param {number} [page]   optional: default 1
     * @param {number} [limit]  optional: default 1
     * @param {string} [status] optional: [new, used]
     * @param {string} [type]   optional: [contractor, admin]
     * @returns {Promise<models.InvitationPaginatedResponse>}
     * @memberof InvitationController
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getInvitations(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('status') status?: string,
        @QueryParam('type') type?: string,
    ): Promise<models.InvitationPaginatedResponse> {
        const logic = new logicLayer.GetInvitationsLogic(this.getRequestContext());
        const invitations = await logic.execute(page, limit, status, type);

        return this.paginate(
            invitations.pagination,
            invitations.rows.map(invitation => {
                return this.map(models.InvitationResponse, invitation);
            }),
        );
    }

    /**
     * Create an invitation
     *
     * @requires {role} admin
     * @param {models.InvitationRequest} data
     * @returns {Promise<models.InvitationResponse>}
     * @memberof InvitationController
     */
    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createInvitation(data: models.InvitationRequest): Promise<models.InvitationResponse> {
        const parsedData = await this.validate(data, models.invitationRequestSchema);
        let user;
        let invitationLogic;
        if (parsedData.type === models.Types.admin) {
            const logic = new AddAdminUserLogic(this.getRequestContext());
            // placeholder for the user's table
            parsedData['firstName'] = parsedData.email;
            user = await logic.execute(parsedData, parsedData.role);
            invitationLogic = new logicLayer.CreateAdminInvitationLogic(this.getRequestContext());
        } else if (parsedData.type === models.Types.contractor) {
            const logic = new AddContractorUserLogic(this.getRequestContext());
            user = await logic.execute(parsedData);
            invitationLogic = new logicLayer.CreateContractorInvitationLogic(this.getRequestContext());
        }
        const invitation = await invitationLogic.execute(user.tenantProfile);
        return this.map(models.InvitationResponse, invitation);
    }

    /**
     * Resend an user's invitation
     *
     * @requires {role} admin
     * @param {models.UserInvitationRequest} data
     * @memberof InvitationController
     */
    @PATCH
    @Path('resend')
    @Preprocessor(BaseController.requireAdmin)
    async resendUserInvitation(data: models.UserInvitationRequest) {
        const parsedData = await this.validate(data, models.userInvitationRequestSchema);
        const logic = new logicLayer.ResendUserInvitationLogic(this.getRequestContext());
        await logic.execute(parsedData.userId);
    }

    /**
     * Resend an invitation
     *
     * @requires {role} admin
     * @param {string} id
     * @memberof InvitationController
     */
    @PATCH
    @Path(':id/resend')
    @Preprocessor(BaseController.requireAdmin)
    async resendInvitation(@PathParam('id') id: string) {
        const logic = new logicLayer.ResendInvitationLogic(this.getRequestContext());
        await logic.execute(id);
    }

    /**
     * Delete an user's invitation
     *
     * @requires {role} admin
     * @param {models.UserInvitationRequest} data
     * @memberof InvitationController
     */
    @DELETE
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async deleteUserInvitation(data: models.UserInvitationRequest) {
        const parsedData = await this.validate(data, models.userInvitationRequestSchema);
        const logic = new logicLayer.DeleteUserInvitationLogic(this.getRequestContext());
        await logic.execute(parsedData.userId);
    }

    /**
     * Delete an invitation
     *
     * @requires {role} admin
     * @param {string} id
     * @memberof InvitationController
     */
    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteInvitation(@PathParam('id') id: string) {
        const logic = new logicLayer.DeleteInvitationLogic(this.getRequestContext());
        await logic.execute(id);
    }
}

/**
 * Public endpoints for retrieving and using invitation tokens
 *
 * @export
 * @class InvitationCheckController
 * @extends {BaseController}
 */
@Path('public/invitations')
@Tags('invitations')
export class InvitationCheckController extends BaseController {
    @GET
    @Path(':id')
    async getInvitation(@PathParam('id') id: string): Promise<models.InvitationResponse> {
        const logic = new logicLayer.GetInvitationLogic(this.getRequestContext());
        const invitation = await logic.execute(id);

        return this.map(models.InvitationResponse, invitation);
    }

    @PUT
    @Path(':id')
    async useInvitationToken(@PathParam('id') id: string) {
        const logic = new logicLayer.UseInvitationLogic(this.getRequestContext());
        const invitation = await logic.execute(id);

        return this.map(models.InvitationResponse, invitation);
    }
}
