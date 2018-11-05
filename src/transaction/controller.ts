import {DELETE, Errors, GET, HttpError, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import * as transfer from './transfer/models';
import {TransactionService} from './service';
import {UserService} from '../user/service';
import {JobService} from '../job/service';
import {Security, Tags} from 'typescript-rest-swagger';
import {transaction} from 'objection';
import {Job} from '../job/models';
import moment from 'moment';
import {FundingSourceService} from '../foundingSource/services';

const validate = require('uuid-validate');

@Security('api_key')
@Path('/transactions')
@Tags('transactions')
export class TransactionController extends BaseController {
    @Inject private service: TransactionService;
    @Inject private userService: UserService;
    @Inject private jobService: JobService;
    @Inject private fundingService: FundingSourceService;

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async getTransaction(@PathParam('id') id: string): Promise<models.TransactionResponse> {
        this.service.setRequestContext(this.getRequestContext());

        const transaction = await this.service.get(id);
        if (!transaction) {
            throw new Errors.NotFoundError();
        }

        return this.map(models.TransactionResponse, transaction);
    }

    /**
     * Transactions can be filtered by createdAt date, both dateFrom and dateTill needs to be provided
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     * @param dateFrom starting Date() of transactions e.g. 2018-08-22T14:44:27.727Z
     * @param dateTill end Date() of transactions, e.g. 2018-08-22T14:44:27.727Z
     * @param userId users id as uuidv4 string
     * @param status transaction status
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async getTransactions(@QueryParam('page') page?: number,
                          @QueryParam('limit') limit?: number,
                          @QueryParam('dateFrom') dateFrom?: Date,
                          @QueryParam('dateTill') dateTill?: Date,
                          @QueryParam('userId') userId?: string,
                          @QueryParam('status') status?: string): Promise<models.PaginatedTransactionResponse> {
        this.service.setRequestContext(this.getRequestContext());

        if (userId && !validate(userId)) {
            throw new Errors.BadRequestError('userId must be uuid');
        }

        const filter = builder => {
            models.Transaction.filter(builder, dateFrom, dateTill, status, userId);
        };

        const transactions = await this.service.list(page, limit, filter);

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
    async createTransaction(data: models.TransactionRequest): Promise<models.TransactionResponse> {
        this.service.setRequestContext(this.getRequestContext());
        this.jobService.setRequestContext(this.getRequestContext());
        this.userService.setRequestContext(this.getRequestContext());
        this.fundingService.setRequestContext(this.getRequestContext());

        const parsedData: models.TransactionRequest = await this.validate(data, models.transactionRequestSchema);
        const user = await this.userService.get(parsedData.userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        if (!user.isContractor()) {
            throw new Errors.NotAcceptableError('User is not a contractor');
        }

        const defaultFunding = await this.fundingService.getDefault(user.id);
        if (!defaultFunding) {
            throw new Errors.NotAcceptableError('User does not have a bank account');
        }

        try {
            const transactionFromDb: models.Transaction = await transaction(models.Transaction.knex(), async trx => {
                const {job: jobRequest} = parsedData;
                let jobFromDb;
                if (!jobRequest.id) {
                    const jobEntity = Job.factory(jobRequest);
                    jobFromDb = await this.jobService.insert(jobEntity, trx);
                } else {
                    jobFromDb = await this.jobService.get(jobRequest.id);
                }
                if (!jobFromDb) {
                    throw new Errors.NotFoundError('Job not found');
                }

                const transactionEntity = models.Transaction.factory(parsedData);
                transactionEntity.adminId = this.getRequestContext().getUser().id;
                transactionEntity.jobId = jobFromDb.id;
                const transactionFromDb = await this.service.insert(transactionEntity, trx);
                transactionFromDb.job = jobFromDb;
                return transactionFromDb;
            });
            return this.map(models.TransactionResponse, transactionFromDb);
        } catch (err) {
            this.logger.error(err);
            if (err instanceof HttpError) {
                throw err;
            }
            throw new Errors.InternalServerError(err.message);
        }
    }

    @POST
    @Path(':id/transfers')
    @Preprocessor(BaseController.requireAdmin)
    async createTransactionTransfer(@PathParam('id') id: string): Promise<models.TransactionResponse> {
        this.service.setRequestContext(this.getRequestContext());
        this.userService.setRequestContext(this.getRequestContext());

        const transaction = await this.service.get(id);
        if (!transaction) {
            throw new Errors.NotFoundError();
        }

        try {
            const user = await this.userService.get(this.getRequestContext().getUser().id);

            if (!transaction.transferId) {
                await this.service.prepareTransfer(transaction, user);
            } else {
                transaction.transfer = await this.service.transferService.get(transaction.transferId);
            }

            if (transaction.transfer.status !== transfer.Statuses.new) {
                throw new Errors.NotAcceptableError('Transfer already pending');
            }

            await this.service.createExternalTransfer(transaction);
        } catch (e) {
            if (e instanceof models.InvalidTransferDataError || e instanceof Errors.NotAcceptableError) {
                throw new Errors.NotAcceptableError(e.message);
            }

            this.logger.error(e);
            throw new Errors.InternalServerError(e.message);
        }

        return this.map(models.TransactionResponse, transaction);
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
    @Preprocessor(BaseController.requireAdmin)
    async getPeriodStats(@QueryParam('startDate') startDate?: string,
                         @QueryParam('endDate') endDate?: string,
                         @QueryParam('limit') limit?: number,
                         @QueryParam('page') page?: number,
                         @QueryParam('status') status?: string): Promise<models.PeriodsStatsResponse> {
        this.service.setRequestContext(this.getRequestContext());
        const _startDate = new Date(startDate);
        const _endDate = new Date(endDate);
        const _prevEndDate = moment(_startDate).subtract(1, 'second').toDate();
        const _prevStartDate = moment(_prevEndDate).subtract(14, 'day').toDate();

        const current: any = await this.service.getPeriodStats(_startDate, _endDate, page, limit, status);
        current.startDate = _startDate;
        current.endDate = _endDate;

        const previous: any = await this.service.getPeriodStats(_prevStartDate, _prevEndDate, page, limit, status);
        previous.startDate = _prevStartDate;
        previous.endDate = _prevEndDate;

        return this.map(models.PeriodsStatsResponse, {current: current, previous: previous});
    }

    @DELETE
    @Path(':id/transfers')
    @Preprocessor(BaseController.requireAdmin)
    async cancelTransactionTransfer(@PathParam('id') id: string): Promise<models.TransactionResponse> {
        this.userService.setRequestContext(this.getRequestContext());
        this.service.setRequestContext(this.getRequestContext());

        const _transaction = await this.service.get(id);
        if (!_transaction) {
            throw new Errors.NotFoundError();
        }

        try {
            const user = await this.userService.get(this.getRequestContext().getUser().id);

            if (!_transaction.transferId || _transaction.canBeCancelled()) {
                throw new Errors.NotAcceptableError('Transfer cannot be cancelled');
            }

            await this.service.cancelTransaction(_transaction);
        } catch (e) {
            if (e instanceof Errors.NotAcceptableError) {
                throw new Errors.NotAcceptableError(e.message);
            }

            this.logger.error(e.message);
            throw new Errors.InternalServerError(e.message);
        }

        return this.map(models.TransactionResponse, _transaction);
    }
}
