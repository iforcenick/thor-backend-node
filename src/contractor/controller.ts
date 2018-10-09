import {Security, Tags} from 'typescript-rest-swagger';
import {Path, POST} from 'typescript-rest';
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
import {ContractorRequest, contractorRequestSchema, ContractorResponse} from './models';
import * as models from '../user/models';

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
    constructor(@Inject mailer: MailerService,
                @Inject dwollaClient: dwolla.Client,
                @Inject service: UserService,
                @Inject profileService: ProfileService,
                @Inject transactionService: TransactionService,
                @Inject userContext: context.UserContext,
                @Inject tenantContext: context.TenantContext,
                @Inject logger: Logger, @Inject config: Config,
                @Inject dwollaNotifier: DwollaNotifier) {
        super(logger, config);
        this.mailer = mailer;
        this.dwollaClient = dwollaClient;
        this.service = service;
        this.profileService = profileService;
        this.transactionService = transactionService;
        this.userContext = userContext;
        this.dwollaNotifier = dwollaNotifier;
    }

    @POST
    @Path('')
    async createUser(data: ContractorRequest): Promise<ContractorResponse> {
        const parsedData = await this.validate(data, contractorRequestSchema);
        ProfileService.validateAge(parsedData['profile']);
        let user = models.User.factory({});

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
}