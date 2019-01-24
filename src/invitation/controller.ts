import {Errors, GET, Path, PathParam, POST, DELETE, Preprocessor, QueryParam, FileParam, PUT} from 'typescript-rest';
import {Inject} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import * as _ from 'lodash';

import {BaseController} from '../api';
import {WorkerPublisher} from '../worker/publisher';
import {SendInvitationEmailMessage} from './messages';
import {InvitationService} from './service';
import {UserService} from '../user/service';
import {TenantService} from '../tenant/service';
import * as models from './models';
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
import {AddContractorUserLogic} from '../user/logic';

/**
 * Endpoints for managing contractor and admin invitations
 *
 * @deprecated moved invitations to user controller
 * @requires api_key
 */
@Security('api_key')
@Path('oldInvitations')
@Tags('oldInvitations')
export class InvitationController extends BaseController {
    @Inject private invitationService: InvitationService;
    @Inject private userService: UserService;
    @Inject private tenantService: TenantService;
    @Inject private publisher: WorkerPublisher;

    /**
     * Endpoint to query for a list of invitations
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
     * Endpoint to create a new administrator invitation
     *
     * similar to the POST /users/admin endpoint,
     * execpt only an email is required
     *
     * @requires {role} admin
     * @param {models.InvitationRequest} data
     * @returns {Promise<models.InvitationResponse>}
     * @memberof InvitationController
     */
    @POST
    @Path('admins')
    @Preprocessor(BaseController.requireAdmin)
    async createAdminInvitation(data: models.InvitationRequest): Promise<models.InvitationResponse> {
        const parsedData = await this.validate(data, models.invitationRequestSchema);
        const logic = new AddContractorUserLogic(this.getRequestContext());
        const user = await logic.execute(parsedData);
        const invitationLogic = new CreateAdminInvitationLogic(this.getRequestContext());
        const invitation = await invitationLogic.execute(user.tenantProfile);

        return this.map(models.InvitationResponse, invitation);
    }

    /**
     * Endpoint to create a new contractor invitation
     *
     * similar to the POST /users/contractors endpoint,
     * except only an email is required
     *
     * @requires {role} admin
     * @param {models.InvitationRequest} data
     * @returns {Promise<models.InvitationResponse>}
     * @memberof InvitationController
     */
    @POST
    @Path('contractors')
    @Preprocessor(BaseController.requireAdmin)
    async createContractorInvitation(data: models.InvitationRequest): Promise<models.InvitationResponse> {
        const parsedData = await this.validate(data, models.invitationRequestSchema);
        const logic = new AddContractorUserLogic(this.getRequestContext());
        const user = await logic.execute(parsedData);
        const invitationLogic = new CreateContractorInvitationLogic(this.getRequestContext());
        const invitation = await invitationLogic.execute(user.tenantProfile);

        return this.map(models.InvitationResponse, invitation);
    }

    /**
     *
     * @param {number} [page]
     * @param {number} [limit]
     * @param {string} [status]
     * @returns {Promise<models.InvitationPaginatedResponse>}
     * @memberof InvitationController
     */
    @POST
    @Path('contractors/background')
    @Preprocessor(BaseController.requireAdmin)
    async sendInvitationByRmq(data: models.InvitationRequest): Promise<models.InvitationResponse> {
        this.invitationService.setRequestContext(this.getRequestContext());
        this.userService.setRequestContext(this.getRequestContext());

        const parsedData = await this.validate(data, models.invitationRequestSchema);
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
                    `${this.config.get('application.frontUri')}/on-boarding/${invitation.id}`,
                    tenant.businessName,
                ),
            );
        } catch (e) {
            this.logger.error(e);
        }

        return this.map(models.InvitationResponse, invitation);
    }

    /**
     * Endpoint to resend a contractor's invitation
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
     * Endpoint to resend an administrator's invitation
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
     * Endpoint to delete a contractor's invitation
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
     * Endpoint to delete an administrator's invitation
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
 * public endpoints for retrieving and using invitation tokens
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
