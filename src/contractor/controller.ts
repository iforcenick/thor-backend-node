import {Security, Tags} from 'typescript-rest-swagger';
import {PATCH, Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {Inject} from 'typescript-ioc';
import * as Errors from 'typescript-rest/dist/server-errors';
import {DwollaNotifier} from '../dwolla/notifier';
import {
    ContractorRequest,
    contractorRequestSchema,
    ContractorResponse,
    PasswordRequest,
    passwordRequestSchema
} from './models';
import {InvitationService} from '../invitation/service';
import {AddContractorLogic} from './logic';

@Security('api_key')
@Path('/contractors')
@Tags('contractor')
export class ContractorController extends BaseController {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private service: UserService;
    @Inject private dwollaNotifier: DwollaNotifier;
    @Inject private invitationService: InvitationService;

    constructor() {
        super();
        this.service.setRequestContext(this.getRequestContext());
    }

    @POST
    @Path('')
    async createUser(data: ContractorRequest): Promise<ContractorResponse> {
        const parsedData = await this.validate(data, contractorRequestSchema);
        const profile = parsedData['profile'];
        ProfileService.validateAge(profile);
        try {
            const logic = new AddContractorLogic(this.getRequestContext());
            const user = await logic.execute(profile, parsedData.tenant, parsedData.invitationToken, parsedData.password);
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

        if (newPassword !== confirmPassword) {
            throw new Errors.ConflictError('Passwords do not match');
        }

        const user = await this.service.get(this.getRequestContext().getUser().id);

        try {
            await this.service.changePassword(user, newPassword, oldPassword);
        } catch (e) {
            this.logger.debug(e.message);
            throw new Errors.ConflictError(e.message);
        }
        return;
    }
}