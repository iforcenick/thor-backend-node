import moment from 'moment';
import {Inject} from 'typescript-ioc';
import {DELETE, Errors, GET, HttpError, PATCH, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import {DwollaRequestError} from '../payment/dwolla';
import * as logicLayer from './logic';
import * as models from './models';
import {TransactionService} from './service';
import {UserService} from '../user/service';

@Security('api_key')
@Path('/transactions')
@Tags('transactions')
export class TransactionController extends BaseController {
    @Inject private transactionService: TransactionService;
    @Inject private userService: UserService;

    /**
     * Get a transaction
     *
     * @param {string} id
     * @returns {Promise<models.TransactionResponse>}
     * @memberof TransactionController
     */
    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdminReader)
    async getTransaction(@PathParam('id') id: string): Promise<models.TransactionResponse> {
        const logic = new logicLayer.GetTransactionLogic(this.getRequestContext());
        const transaction = await logic.execute(id);
        return this.map(models.TransactionResponse, transaction);
    }

    /**
     * Transactions can be filtered by createdAt date, both dateFrom and dateTill needs to be provided
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     * @param startDate starting Date() of transactions e.g. 2018-08-22T14:44:27.727Z
     * @param endDate end Date() of transactions, e.g. 2018-08-22T14:44:27.727Z
     * @param userId users id as uuidv4 string
     * @param status transaction status
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getTransactions(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('startDate') startDate?: Date,
        @QueryParam('endDate') endDate?: Date,
        @QueryParam('userId') userId?: string,
        @QueryParam('status') status?: string,
    ): Promise<models.PaginatedTransactionResponse> {
        const logic = new logicLayer.GetUserTransactionsLogic(this.getRequestContext());
        const transactions = await logic.execute(userId, page, limit, startDate, endDate, status);
        return this.paginate(
            transactions.pagination,
            transactions.rows.map(transaction => {
                return this.map(models.TransactionResponse, transaction);
            }),
        );
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async createTransactionWithExistingJob(
        data: models.TransactionExistingJobRequest,
    ): Promise<models.TransactionResponse> {
        const parsedData: models.TransactionExistingJobRequest = await this.validate(
            data,
            models.transactionExistingJobRequestSchema,
        );

        try {
            const logic = new logicLayer.CreateTransactionWithExistingJobLogic(this.getRequestContext());
            const transaction = await logic.execute(
                parsedData.userId,
                parsedData.jobId,
                parsedData.value,
                parsedData.externalId,
            );
            return this.map(models.TransactionResponse, transaction);
        } catch (err) {
            if (err instanceof HttpError) {
                throw err;
            }

            if (err instanceof DwollaRequestError) {
                throw err.toValidationError();
            }

            throw new Errors.InternalServerError(err.message);
        }
    }

    @POST
    @Path('/custom')
    @Preprocessor(BaseController.requireAdmin)
    async createTransactionWithCustomJob(
        data: models.TransactionCustomJobRequest,
    ): Promise<models.TransactionResponse> {
        const parsedData: models.TransactionCustomJobRequest = await this.validate(
            data,
            models.transactionCustomJobRequestSchema,
        );

        try {
            const logic = new logicLayer.CreateTransactionWithCustomJobLogic(this.getRequestContext());
            const transaction = await logic.execute(
                parsedData.userId,
                parsedData.job,
                parsedData.value,
                parsedData.externalId,
            );
            return this.map(models.TransactionResponse, transaction);
        } catch (err) {
            if (err instanceof HttpError) {
                throw err;
            }

            if (err instanceof DwollaRequestError) {
                throw err.toValidationError();
            }

            throw new Errors.InternalServerError(err.message);
        }
    }

    @PATCH
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async updateTransaction(
        @PathParam('id') id: string,
        data: models.TransactionPatchRequest,
    ): Promise<models.TransactionResponse> {
        const parsedData: models.TransactionPatchRequest = await this.validate(
            data,
            models.transactionPatchRequestSchema,
        );

        const logic = new logicLayer.UpdateTransactionLogic(this.getRequestContext());
        const transaction = await logic.execute(id, parsedData);
        return this.map(models.TransactionResponse, transaction);
    }

    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteTransaction(@PathParam('id') id: string) {
        const logic = new logicLayer.DeleteTransactionLogic(this.getRequestContext());
        await logic.execute(id);
    }

    @POST
    @Path(':id/transfers')
    @Preprocessor(BaseController.requireAdmin)
    async createTransactionTransfer(@PathParam('id') id: string): Promise<models.TransactionResponse> {
        const logic = new logicLayer.CreateTransactionsTransferLogic(this.getRequestContext());
        const transaction = await logic.execute([id]);

        return this.map(models.TransactionResponse, transaction);
    }

    @POST
    @Path('transfers')
    @Preprocessor(BaseController.requireAdmin)
    async createTransactionsTransfer(data: models.TransactionsTransferRequest): Promise<models.TransferResponse> {
        const logic = new logicLayer.CreateTransactionsTransferLogic(this.getRequestContext());
        const transfer = await logic.execute(data['transactionsIds']);

        return this.map(models.TransferResponse, transfer);
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     * @param startDate startDate
     * @param endDate endDate
     * @param status status
     */
    @GET
    @Path('/rating/period')
    @Preprocessor(BaseController.requireAdminReader)
    async getPeriodStats(
        @QueryParam('startDate') startDate?: string,
        @QueryParam('endDate') endDate?: string,
        @QueryParam('limit') limit?: number,
        @QueryParam('page') page?: number,
        @QueryParam('status') status?: string,
    ): Promise<models.PeriodsStatsResponse> {
        this.transactionService.setRequestContext(this.getRequestContext());
        const _startDate = new Date(startDate);
        const _endDate = new Date(endDate);
        const _prevEndDate = moment(_startDate)
            .subtract(1, 'second')
            .toDate();
        const _prevStartDate = moment(_prevEndDate)
            .subtract(14, 'day')
            .toDate();

        const current: any = await this.transactionService.getPeriodStats(_startDate, _endDate, page, limit, status);
        current.startDate = _startDate;
        current.endDate = _endDate;

        const previous: any = await this.transactionService.getPeriodStats(
            _prevStartDate,
            _prevEndDate,
            page,
            limit,
            status,
        );
        previous.startDate = _prevStartDate;
        previous.endDate = _prevEndDate;

        return this.map(models.PeriodsStatsResponse, {current: current, previous: previous});
    }

    @DELETE
    @Path(':id/transfers')
    @Preprocessor(BaseController.requireAdmin)
    async cancelTransactionTransfer(@PathParam('id') id: string): Promise<models.TransactionResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        this.transactionService.setRequestContext(this.getRequestContext());

        const _transaction = await this.transactionService.get(id);
        if (!_transaction) {
            throw new Errors.NotFoundError();
        }

        try {
            if (!_transaction.transferId || _transaction.canBeCancelled()) {
                throw new Errors.NotAcceptableError('Transfer cannot be cancelled');
            }

            const cancelLogic = new logicLayer.CancelTransferLogic(this.getRequestContext());
            await cancelLogic.execute(_transaction.transferId);
        } catch (e) {
            if (e instanceof Errors.NotAcceptableError) {
                throw new Errors.NotAcceptableError(e.message);
            }

            this.logger.error(e);
            throw new Errors.InternalServerError(e.message);
        }

        return this.map(models.TransactionResponse, _transaction);
    }
}

@Security('api_key')
@Path('/users/:userId/transactions')
@Tags('users', 'transactions')
export class UserTransactionController extends BaseController {
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getUserTransactions(
        @PathParam('userId') userId: string,
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('startDate') startDate?: Date,
        @QueryParam('endDate') endDate?: Date,
        @QueryParam('status') status?: string,
    ): Promise<models.PaginatedTransactionResponse> {
        const logic = new logicLayer.GetUserTransactionsLogic(this.getRequestContext());
        const transactions = await logic.execute(userId, page, limit, startDate, endDate, status);
        return this.paginate(
            transactions.pagination,
            transactions.rows.map(transaction => {
                return this.map(models.TransactionResponse, transaction);
            }),
        );
    }
}
