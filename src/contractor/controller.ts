import {Security, Tags} from 'typescript-rest-swagger';
import {PATCH, Path, PathParam, POST, PUT} from 'typescript-rest';
import {BaseController} from '../api';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {Inject} from 'typescript-ioc';
import * as Errors from 'typescript-rest/dist/server-errors';
import {
    ContractorRequest,
    contractorRequestSchema,
    ContractorResponse,
    PasswordRequest,
    passwordRequestSchema
} from './models';
import {AddContractorOnRetryStatusLogic, AddInvitedContractorLogic} from './logic';

@Security('api_key')
@Path('/contractors')
@Tags('contractors')
export class ContractorController extends BaseController {
    @Inject private service: UserService;

    @POST
    @Path('')
    async addContractor(data: ContractorRequest): Promise<ContractorResponse> {
        this.service.setRequestContext(this.getRequestContext());

        const parsedData = await this.validate(data, contractorRequestSchema);
        const profile = parsedData['profile'];
        ProfileService.validateAge(profile);
        try {
            const logic = new AddInvitedContractorLogic(this.getRequestContext());
            const user = await logic.execute(profile, parsedData.invitationToken, parsedData.password);
            const contractorResponse = this.map(ContractorResponse, user);
            contractorResponse.token = await this.service.generateJwt(user);

            return contractorResponse;
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError('profile');
            }

            throw err;
        }
    }

    @PATCH
    @Path('/password')
    @Tags('auth')
    async changePassword(data: PasswordRequest) {
        this.service.setRequestContext(this.getRequestContext());

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