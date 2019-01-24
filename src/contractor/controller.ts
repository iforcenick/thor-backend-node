import {Security, Tags} from 'typescript-rest-swagger';
import {GET, Path, POST, Preprocessor, QueryParam} from 'typescript-rest';

import {BaseController, dateRangeSchema} from '../api';
import {ContractorRequest, contractorRequestSchema, ContractorResponse} from './models';
import * as transactions from '../transaction/models';
import {CreateContractorLogic, GetContractorTransactionsLogic} from './logic';

@Security('api_key')
@Path('/contractors')
@Tags('contractors')
export class ContractorController extends BaseController {
    /**
     * TODO:
     *
     * @param {ContractorRequest} data
     * @returns {Promise<ContractorResponse>}
     * @memberof ContractorController
     */
    @POST
    @Path('')
    @Preprocessor(BaseController.requireContractor)
    async createContractor(data: ContractorRequest): Promise<ContractorResponse> {
        const parsedData = await this.validate(data, contractorRequestSchema);
        const logic = new CreateContractorLogic(this.getRequestContext());
        const user = await logic.execute(parsedData.profile);

        return this.map(ContractorResponse, user);
    }

    /**
     * Get a list of the contractor's transactions
     *
     * @param {number} [page]
     * @param {number} [limit]
     * @param {Date} [startDate]
     * @param {Date} [endDate]
     * @param {string} [status]
     * @returns {Promise<transactions.PaginatedTransactionResponse>}
     * @memberof ContractorController
     */
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
