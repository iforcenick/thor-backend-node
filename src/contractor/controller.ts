import {Security, Tags} from 'typescript-rest-swagger';
import {Path, POST} from 'typescript-rest';
import {BaseController} from '../api';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {Inject} from 'typescript-ioc';
import {ContractorRequest, contractorRequestSchema, ContractorResponse} from './models';
import {AddInvitedContractorLogic} from './logic';

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

            return this.map(ContractorResponse, user);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError('profile');
            }

            throw err;
        }
    }
}