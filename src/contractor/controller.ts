import {Security, Tags} from 'typescript-rest-swagger';
import {GET, Path, POST, Preprocessor, QueryParam} from 'typescript-rest';

import {BaseController, dateRangeSchema} from '../api';
import {ContractorRequest, contractorRequestSchema, ContractorResponse} from './models';
import * as transactions from '../transaction/models';
import {AddInvitedContractorLogic, GetContractorTransactionsLogic} from './logic';

@Security('api_key')
@Path('/contractors')
@Tags('contractors')
export class ContractorController extends BaseController {
    @POST
    @Path('')
    async createContractor(data: ContractorRequest): Promise<ContractorResponse> {
        const parsedData = await this.validate(data, contractorRequestSchema);
        const logic = new AddInvitedContractorLogic(this.getRequestContext());
        const user = await logic.execute(parsedData['profile'], parsedData.invitationToken, parsedData.password);
        return this.map(ContractorResponse, user);
    }

    @GET
    @Path('/transactions')
    @Preprocessor(BaseController.requireContractor)
    async getTransactions(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('startDate') startDate?: Date,
        @QueryParam('endDate') endDate?: Date,
        @QueryParam('status') status?: string,
    ): Promise<transactions.PaginatedTransactionResponse> {
        const dates: any = await this.validate({startDate, endDate}, dateRangeSchema);
        const logic = new GetContractorTransactionsLogic(this.getRequestContext());
        const transactionsList = await logic.execute(
            this.getRequestContext().getUserId(),
            dates.startDate,
            dates.endDate,
            status,
            page,
            limit,
        );

        return this.paginate(
            transactionsList.pagination,
            transactionsList.rows.map(transaction => {
                return this.map(transactions.TransactionResponse, transaction);
            }),
        );
    }
}
