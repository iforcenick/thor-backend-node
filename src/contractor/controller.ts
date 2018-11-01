import {Security, Tags} from 'typescript-rest-swagger';
import {PATCH, Path, PathParam, POST, Preprocessor} from 'typescript-rest';
import {BaseController} from '../api';
import {MailerService} from '../mailer';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {TransactionService} from '../transaction/service';
import * as context from '../context';
import {Inject} from 'typescript-ioc';
import {Logger} from '../logger';
import {Config} from '../config';
import {Profile} from '../profile/models';
import {ValidationError} from '../errors';
import * as Errors from 'typescript-rest/dist/server-errors';
import {DwollaNotifier} from '../dwolla/notifier';
import {
    ContractorRequest,
    contractorRequestSchema,
    ContractorResponse,
    PasswordRequest, passwordRequestSchema
} from './models';
import * as usersModels from '../user/models';
import {FundingSource} from '../foundingSource/models';
import {FundingSourceService} from '../foundingSource/services';
import {transaction} from 'objection';
import {InvitationService} from '../invitation/service';
import {Status} from '../invitation/models';
import {BadRequestError} from 'typescript-rest/dist/server-errors';

@Security('api_key')
@Path('/contractors')
@Tags('contractor')
export class ContractorController extends BaseController {
    private mailer: MailerService;
    private dwollaClient: dwolla.Client;
    private service: UserService;
    private profileService: ProfileService;
    private transactionService: TransactionService;
    private userContext: context.UserContext;
    private dwollaNotifier: DwollaNotifier;
    private fundingSourceService: FundingSourceService;
    private invitationService: InvitationService;

    constructor(@Inject mailer: MailerService,
                @Inject dwollaClient: dwolla.Client,
                @Inject service: UserService,
                @Inject profileService: ProfileService,
                @Inject transactionService: TransactionService,
                @Inject userContext: context.UserContext,
                @Inject tenantContext: context.TenantContext,
                @Inject logger: Logger, @Inject config: Config,
                @Inject dwollaNotifier: DwollaNotifier,
                @Inject fundingSourceService: FundingSourceService,
                @Inject invitationService: InvitationService) {
        super(logger, config);
        this.mailer = mailer;
        this.dwollaClient = dwollaClient;
        this.service = service;
        this.profileService = profileService;
        this.transactionService = transactionService;
        this.userContext = userContext;
        this.dwollaNotifier = dwollaNotifier;
        this.fundingSourceService = fundingSourceService;
        this.invitationService = invitationService;
    }

    @POST
    @Path('')
    async createUser(data: ContractorRequest): Promise<ContractorResponse> {
        const parsedData = await this.validate(data, contractorRequestSchema);
        ProfileService.validateAge(parsedData['profile']);
        let user: usersModels.User = usersModels.User.factory({});

        const profile = Profile.factory(parsedData['profile']);
        try {
            await this.dwollaClient.authorize();
            const customer = dwolla.customer.factory(parsedData['profile']);
            customer.type = dwolla.customer.TYPE.Personal;
            profile.dwollaUri = await this.dwollaClient.createCustomer(customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(profile.dwollaUri);
            profile.dwollaStatus = dwollaCustomer.status;
            profile.dwollaType = dwollaCustomer.type;

            this.service.setTenantId(data.tenant);
            user.password = await this.service.hashPassword(data.password);
            user = await this.service.createWithProfile(user, profile, data.tenant);
            user = await this.service.get(user.id);
            await this.dwollaNotifier.sendNotificationForDwollaCustomer(user, dwollaCustomer.status);

            const invitation = await this.invitationService.getForAllTenants(data.invitationToken);

            if (invitation.email != data.profile.email) {
                throw new BadRequestError('Contractor and invitation emails do not match.');
            }

            invitation.status = Status.used;
            await this.invitationService.update(invitation);

            const contractorResponse = this.map(ContractorResponse, user);
            contractorResponse.token = await this.service.generateJwt(user);

            return contractorResponse;
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError('profile');
            }
            throw new Errors.InternalServerError(err.message);
        }
    }

    @Security('api_key')
    @PATCH
    @Path('/password')
    @Tags('auth')
    async changePassword(data: PasswordRequest) {
        const parsedData = await this.validate(data, passwordRequestSchema);
        const oldPassword = parsedData['oldPassword'];
        const newPassword = parsedData['newPassword'];
        const confirmPassword = parsedData['confirmPassword'];
        const user = await this.service.get(this.userContext.get().id);

        if (newPassword !== confirmPassword) {
            throw new Errors.ConflictError('Passwords do not match');
        }

        try {
            await this.service.changePassword(user, newPassword, oldPassword);
        } catch (e) {
            this.logger.debug(e.message);
            throw new Errors.ConflictError(e.message);
        }
        return;
    }
}