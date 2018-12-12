import {Security, Tags} from 'typescript-rest-swagger';
import {GET, Path, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {BaseController, dateRangeSchema} from '../api';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {Inject} from 'typescript-ioc';
import {ContractorRequest, contractorRequestSchema, ContractorResponse} from './models';
import {AddInvitedContractorLogic, GetContractorTransactionsLogic} from './logic';
import * as transactions from '../transaction/models';

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

    @GET
    @Path('/transactions')
    @Preprocessor(BaseController.requireContractor)
    async getTransactions(@QueryParam('page') page?: number,
                          @QueryParam('limit') limit?: number,
                          @QueryParam('startDate') startDate?: Date,
                          @QueryParam('endDate') endDate?: Date,
                          @QueryParam('status') status?: string): Promise<transactions.PaginatedTransactionResponse> {
        const logic = new GetContractorTransactionsLogic(this.getRequestContext());
        const dates: any = await this.validate({startDate, endDate}, dateRangeSchema);
        const transactionsList = await logic.execute(this.getRequestContext().getUserId(), dates.startDate, dates.endDate, status, page, limit);

        return this.paginate(
            transactionsList.pagination,
            transactionsList.rows.map(transaction => {
                return this.map(transactions.TransactionResponse, transaction);
            }),
        );
    }
}