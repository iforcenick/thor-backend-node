import {Errors, GET, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {InvitationService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';
import * as context from '../context';
import {Config} from '../config';

@Security('api_key')
@Path('/contractors/invitations')
@Tags('contractorsInvitations')
export class InvitationController extends BaseController {
    private service: InvitationService;
    private userContext: context.UserContext;

    constructor(@Inject service: InvitationService,
                @Inject userContext: context.UserContext,
                @Inject logger: Logger, @Inject config: Config) {
        super(logger, config);
        this.service = service;
        this.userContext = userContext;
    }

    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async getInvitations(@QueryParam('page') page?: number,
                         @QueryParam('limit') limit?: number,
                         @QueryParam('status') status?: string): Promise<models.InvitationPaginatedResponse> {
        const filter = builder => {
            models.Invitation.filter(builder, status);
        };

        const transactions = await this.service.list(page, limit, filter);

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
        const parsedData = await this.validate(data, models.requestSchema);
        let invitation = models.Invitation.factory(parsedData);
        invitation.status = models.Status.pending;

        if (await this.service.getByEmail(invitation.email)) {
            throw new Errors.ConflictError('Email already invited');
        }

        try {
            invitation = await this.service.insert(invitation);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.InvitationResponse, invitation);
    }
}

@Path('/contractorsInvitations')
@Tags('contractorsInvitations')
export class InvitationCheckController extends BaseController {
    private service: InvitationService;
    private userContext: context.UserContext;

    constructor(@Inject service: InvitationService,
                @Inject userContext: context.UserContext,
                @Inject logger: Logger, @Inject config: Config) {
        super(logger, config);
        this.service = service;
        this.userContext = userContext;
    }

    @GET
    @Path(':id')
    async getInvitation(@PathParam('id') id: string): Promise<models.InvitationResponse> {
        const invitation = await this.service.getForAllTenants(id);
        if (!invitation) {
            throw new Errors.NotFoundError();
        }

        if (invitation.status != models.Status.pending) {
            throw new Errors.NotAcceptableError('Invitation already used');
        }

        return this.map(models.InvitationResponse, invitation);
    }
}
