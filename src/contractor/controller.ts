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
    FundingSourceRequest,
    fundingSourceRequestSchema, PasswordRequest, passwordRequestSchema
} from './models';
import * as usersModels from '../user/models';
import {FundingSource} from '../foundingSource/models';
import {FoundingSourceService} from '../foundingSource/services';
import {transaction} from 'objection';

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
    private foundingSourceService: FoundingSourceService;
    constructor(@Inject mailer: MailerService,
                @Inject dwollaClient: dwolla.Client,
                @Inject service: UserService,
                @Inject profileService: ProfileService,
                @Inject transactionService: TransactionService,
                @Inject userContext: context.UserContext,
                @Inject tenantContext: context.TenantContext,
                @Inject logger: Logger, @Inject config: Config,
                @Inject dwollaNotifier: DwollaNotifier, @Inject foundingSourceService: FoundingSourceService) {
        super(logger, config);
        this.mailer = mailer;
        this.dwollaClient = dwollaClient;
        this.service = service;
        this.profileService = profileService;
        this.transactionService = transactionService;
        this.userContext = userContext;
        this.dwollaNotifier = dwollaNotifier;
        this.foundingSourceService = foundingSourceService;
    }

    @POST
    @Path('')
    async createUser(data: ContractorRequest): Promise<ContractorResponse> {
        const parsedData = await this.validate(data, contractorRequestSchema);
        ProfileService.validateAge(parsedData['profile']);
        let user: usersModels.User = usersModels.User.factory({}) ;

        const profile = Profile.factory(parsedData['profile']);
        try {
            await this.dwollaClient.authorize();
            const customerData = dwolla.customer.factory(parsedData['profile']);
            customerData.type = dwolla.customer.TYPE.Personal;
            const customer = new dwolla.customer.Customer(customerData);
            profile.dwollaUri = await this.dwollaClient.createCustomer(customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(profile.dwollaUri);
            profile.dwollaStatus = dwollaCustomer.status;

            this.service.setTenantId(data.tenantId);
            user.password = await this.service.hashPassword(data.password);
            user = await this.service.createWithProfile(user, profile, data.tenantId);
            user = await this.service.get(user.id);
            await this.dwollaNotifier.sendNotificationForDwollaCustomer(user, dwollaCustomer.status);
            return this.map(ContractorResponse, user);
        } catch (err) {
            this.logger.error(err);
            if (err.body) {
                const {body} = err;
                if (body.code) {
                    const {code} = body;
                    if (code === 'ValidationError') {
                        throw new ValidationError(`Invalid value for Fields: profile,${body._embedded.errors[0].path.replace('/', '')}`);
                    }
                }
            }
            throw new Errors.InternalServerError(err.message);
        }
    }

    @POST
    @Path('fundingSources')
    @Preprocessor(BaseController.requireContractor)
    async createUserFundingSource(data: FundingSourceRequest) {
        const parsedData = await this.validate(data, fundingSourceRequestSchema);
        const user = await this.service.get(this.userContext.get().id);
        if (!user) {
            throw new Errors.NotFoundError();
        }

        const profile: Profile = user.tenantProfile;
        try {

            await this.dwollaClient.authorize();
            const sourceUri = await this.dwollaClient.createFundingSource(
                profile.dwollaUri,
                parsedData['routingNumber'],
                parsedData['accountNumber'],
                'checking',
                'default',
            );

            profile.dwollaRouting = parsedData['routingNumber'];
            profile.dwollaAccount = parsedData['accountNumber'];

            const foundSource: FundingSource = FundingSource.factory({
                routing: parsedData['routingNumber'],
                account: parsedData['accountNumber'],
                type: 'checking',
                name: 'default',
                profileId: profile.id,
                tenantId: profile.tenantId,
                isDefault: false,
                dwollaUri: sourceUri
            });

            const sourceInfo = {
                sourceUri: profile.dwollaSourceUri,
                routing: profile.dwollaRouting,
                account: profile.dwollaAccount,
            };

            try {
                await this.mailer.sendFundingSourceRemoved(user, sourceInfo);
            } catch (e) {
                this.logger.error(e);
            }

            await transaction(this.profileService.transaction(), async trx => {
                await this.foundingSourceService.insert(foundSource, trx);
                await this.profileService.addFundingSource(profile, foundSource, trx);
            });

        } catch (err) {
            this.logger.error(err);
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