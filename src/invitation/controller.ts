import * as _ from 'lodash';
import {Inject} from 'typescript-ioc';
import {Errors, GET, Path, PathParam, POST, DELETE, Preprocessor, QueryParam, FileParam, PUT} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import {
    BatchInvitationsLogic,
    GetInvitationLogic,
    UseInvitationLogic,
    ResendInvitationLogic,
    DeleteInvitationLogic,
    GetInvitationsLogic,
    CreateContractorInvitationLogic,
    CreateAdminInvitationLogic,
} from './logic';
import {AddContractorUserLogic, AddAdminUserLogic} from '../user/logic';
import {SendInvitationEmailMessage} from './messages';
import * as models from './models';
import {WorkerPublisher} from '../worker/publisher';
import {InvitationService} from './service';
import {UserService} from '../user/service';
import {TenantService} from '../tenant/service';

/**
 * Manage contractor and administator invitations
 *
 * @requires api_key
 * @export
 * @class InvitationController
 * @extends {BaseController}
 */
@Security('api_key')
@Path('users/invitations')
@Tags('users/invitations')
export class InvitationController extends BaseController {
    @Inject private invitationService: InvitationService;
    @Inject private userService: UserService;
    @Inject private tenantService: TenantService;
    @Inject private publisher: WorkerPublisher;

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
        const logic = new GetInvitationsLogic(this.getRequestContext());
        const invitations = await logic.execute(page, limit, status, type);

        return this.paginate(
            invitations.pagination,
            invitations.rows.map(invitation => {
                return this.map(models.InvitationResponse, invitation);
            }),
        );
    }

    /**
     * Create a new administrator invitation
     *
     * @requires {role} admin
     * @param {models.AdminInvitationRequest} data
     * @returns {Promise<models.InvitationResponse>}
     * @memberof InvitationController
     */
    @POST
    @Path('admins')
    @Preprocessor(BaseController.requireAdmin)
    async createAdminInvitation(data: models.AdminInvitationRequest): Promise<models.InvitationResponse> {
        const parsedData = await this.validate(data, models.adminInvitationRequestSchema);
        const logic = new AddAdminUserLogic(this.getRequestContext());
        // placeholder for the user's table
        parsedData['firstName'] = parsedData.email;
        const user = await logic.execute(parsedData.profile, parsedData.profile.role);
        const invitationLogic = new CreateAdminInvitationLogic(this.getRequestContext());
        const invitation = await invitationLogic.execute(user.tenantProfile);

        return this.map(models.InvitationResponse, invitation);
    }

    /**
     * Create a new contractor invitation
     *
     * @requires {role} admin
     * @param {models.ContractorInvitationRequest} data
     * @returns {Promise<models.InvitationResponse>}
     * @memberof InvitationController
     */
    @POST
    @Path('contractors')
    @Preprocessor(BaseController.requireAdmin)
    async createContractorInvitation(data: models.ContractorInvitationRequest): Promise<models.InvitationResponse> {
        const parsedData = await this.validate(data, models.contractorInvitationRequestSchema);
        const logic = new AddContractorUserLogic(this.getRequestContext());
        // placeholder for the user's table
        parsedData['firstName'] = parsedData.email;
        const user = await logic.execute(parsedData);
        const invitationLogic = new CreateContractorInvitationLogic(this.getRequestContext());
        const invitation = await invitationLogic.execute(user.tenantProfile);

        return this.map(models.InvitationResponse, invitation);
    }

    /**
     * Create a new contractor invitation
     *
     * @param {models.ContractorInvitationRequest} data
     * @returns {Promise<models.InvitationResponse>}
     * @memberof InvitationController
     */
    @POST
    @Path('contractors/background')
    @Preprocessor(BaseController.requireAdmin)
    async sendInvitationByRmq(data: models.ContractorInvitationRequest): Promise<models.InvitationResponse> {
        this.invitationService.setRequestContext(this.getRequestContext());
        this.userService.setRequestContext(this.getRequestContext());

        const parsedData = await this.validate(data, models.contractorInvitationRequestSchema);
        const user = await this.getRequestContext().getUserId();
        let invitation = models.Invitation.factory(parsedData);
        invitation.status = models.Status.pending;

        if (await this.invitationService.getByEmail(invitation.email)) {
            throw new Errors.ConflictError('Email already invited');
        }

        if (await this.userService.findByEmailAndTenant(invitation.email, this.getRequestContext().getTenantId())) {
            throw new Errors.ConflictError('Email already used');
        }

        if (invitation.externalId) {
            if (await this.invitationService.getByExternalId(invitation.externalId)) {
                throw new Errors.ConflictError('External Id already used');
            }

            if (
                await this.userService.findByExternalIdAndTenant(
                    invitation.externalId,
                    this.getRequestContext().getTenantId(),
                )
            ) {
                throw new Errors.ConflictError('External Id already used');
            }
        }

        try {
            invitation = await this.invitationService.insert(invitation);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        try {
            const tenant = await this.tenantService.get(this.getRequestContext().getTenantId());

            await this.publisher.publish(
                new SendInvitationEmailMessage(
                    invitation.email,
                    `${this.config.get('application.frontUri')}/register/${invitation.id}`,
                    tenant.businessName,
                ),
            );
        } catch (e) {
            this.logger.error(e);
        }

        return this.map(models.InvitationResponse, invitation);
    }

    /**
     * Resend a contractor's invitation
     *
     * @requires {role} [admin, adminReader]
     * @param {string} userId
     * @memberof InvitationController
     */
    @POST
    @Path('contractors/:userId/resend')
    @Preprocessor(BaseController.requireAdminReader)
    async resendContractorInvitation(@PathParam('userId') userId: string) {
        const logic = new ResendInvitationLogic(this.getRequestContext());
        await logic.execute(userId);
    }

    /**
     * Resend an administrator's invitation
     *
     * @requires {role} admin
     * @param {string} userId
     * @memberof InvitationController
     */
    @POST
    @Path('admin/:userId/resend')
    @Preprocessor(BaseController.requireAdmin)
    async resendAdminInvitation(@PathParam('userId') userId: string) {
        const logic = new ResendInvitationLogic(this.getRequestContext());
        await logic.execute(userId);
    }

    /**
     * Delete a contractor's invitation
     *
     * @requires {role} admin
     * @param {string} userId
     * @memberof InvitationController
     */
    @DELETE
    @Path('contractors/:userId')
    @Preprocessor(BaseController.requireAdmin)
    async deleteContractorInvitation(@PathParam('userId') userId: string) {
        const logic = new DeleteInvitationLogic(this.getRequestContext());
        await logic.execute(userId);
    }

    /**
     * Delete an administrator's invitation
     *
     * @requires {role} admin
     * @param {string} userId
     * @memberof InvitationController
     */
    @DELETE
    @Path('admin/:userId')
    @Preprocessor(BaseController.requireAdmin)
    async deleteAdminInvitation(@PathParam('userId') userId: string) {
        const logic = new DeleteInvitationLogic(this.getRequestContext());
        await logic.execute(userId);
    }

    @POST
    @Path('contractors/import')
    @Preprocessor(BaseController.requireAdmin)
    async importFromCsv(@FileParam('filepond') file: Express.Multer.File): Promise<models.InvitationsResponse> {
        if (!file) {
            throw new Errors.NotAcceptableError('File missing');
        }
        const logic = new BatchInvitationsLogic(this.getRequestContext());
        const invitations = await logic.execute(file.buffer);

        const invitationsResponse = new models.InvitationsResponse();
        invitationsResponse.items = [];
        invitations.map(invitation => invitationsResponse.items.push(this.map(models.InvitationResponse, invitation)));

        return invitationsResponse;
    }
}

/**
 * Public endpoints for retrieving and using invitation tokens
 *
 * @export
 * @class InvitationCheckController
 * @extends {BaseController}
 */
@Path('invitations')
@Tags('invitations')
export class InvitationCheckController extends BaseController {
    @GET
    @Path(':id')
    async getInvitation(@PathParam('id') id: string): Promise<models.InvitationResponse> {
        const logic = new GetInvitationLogic(this.getRequestContext());
        const invitation = await logic.execute(id);

        return this.map(models.InvitationResponse, invitation);
    }

    @PUT
    @Path(':id')
    async useInvitationToken(@PathParam('id') id: string) {
        const logic = new UseInvitationLogic(this.getRequestContext());
        const invitation = await logic.execute(id);

        return this.map(models.InvitationResponse, invitation);
    }
}
