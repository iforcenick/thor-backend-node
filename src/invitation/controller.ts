import {Errors, GET, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {InvitationService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';
import {MailerService} from '../mailer';
import {UserService} from '../user/service';
import {TenantService} from '../tenant/service';

@Security('api_key')
@Path('/contractors/invitations')
@Tags('contractorsInvitations')
export class InvitationController extends BaseController {
    @Inject private service: InvitationService;
    @Inject private userService: UserService;
    @Inject private tenantService: TenantService;
    @Inject private mailer: MailerService;

    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async getInvitations(@QueryParam('page') page?: number,
                         @QueryParam('limit') limit?: number,
                         @QueryParam('status') status?: string): Promise<models.InvitationPaginatedResponse> {
        this.service.setRequestContext(this.getRequestContext());

        const filter = builder => {
            models.Invitation.filter(builder, status);
        };

        const options = builder => {
            builder.orderBy(`${models.Invitation.tableName}.createdAt`, 'desc');
        };

        const transactions = await this.service.list(page, limit, filter, options);

        return this.paginate(
            transactions.pagination,
            transactions.rows.map(transaction => {
                return this.map(models.InvitationResponse, transaction);
            }),
        );
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createInvitation(data: models.InvitationRequest): Promise<models.InvitationResponse> {
        this.service.setRequestContext(this.getRequestContext());
        this.userService.setRequestContext(this.getRequestContext());

        const parsedData = await this.validate(data, models.requestSchema);
        const user = await this.getRequestContext().getUser();
        let invitation = models.Invitation.factory(parsedData);
        invitation.status = models.Status.pending;

        if (await this.service.getByEmail(invitation.email)) {
            throw new Errors.ConflictError('Email already invited');
        }

        if (await this.userService.findByEmailAndTenant(invitation.email, this.getRequestContext().getTenantId())) {
            throw  new Errors.ConflictError('Email already used');
        }

        try {
            invitation = await this.service.insert(invitation);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        try {
            const tenant = await this.tenantService.get(this.getRequestContext().getTenantId());
            await this.mailer.sendInvitation(invitation.email, {
                link: `${this.config.get('application.frontUri')}/on-boarding/${invitation.id}`,
                companyName: tenant.businessName
            });
        } catch (e) {
            this.logger.error(e.message);
        }

        return this.map(models.InvitationResponse, invitation);
    }
}

@Path('/contractorsInvitations')
@Tags('contractorsInvitations')
export class InvitationCheckController extends BaseController {
    @Inject private service: InvitationService;

    @GET
    @Path(':id')
    async getInvitation(@PathParam('id') id: string): Promise<models.InvitationResponse> {
        this.service.setRequestContext(this.getRequestContext());

        const invitation = await this.service.getForAllTenants(id);
        if (!invitation) {
            throw new Errors.NotFoundError();
        }

        if (!invitation.isPending()) {
            throw new Errors.NotAcceptableError('Invitation already used');
        }

        return this.map(models.InvitationResponse, invitation);
    }

    @POST
    @Path(':id')
    async useInvitationToken(@PathParam('id') id: string) {
        this.service.setRequestContext(this.getRequestContext());

        const invitation = await this.service.getForAllTenants(id);
        if (!invitation) {
            throw new Errors.NotFoundError();
        }

        if (!invitation.isPending()) {
            throw new Errors.NotAcceptableError('Invitation already used');
        }

        invitation.status = models.Status.used;

        await this.service.update(invitation);
    }
}
