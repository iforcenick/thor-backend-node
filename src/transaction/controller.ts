import {
    ContextRequest,
    Errors,
    GET,
    HttpError,
    Path,
    PathParam,
    POST,
    Preprocessor,
    QueryParam,
    ServiceContext,
} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
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

const validate = require('uuid-validate');

@Security('api_key')
@Path('/transactions')
@Tags('transactions')
export class TransactionController extends BaseController {
    @Inject private logger: Logger;
    private service: TransactionService;
    private userService: UserService;
    private jobService: JobService;

    constructor(@Inject service: TransactionService, @Inject userService: UserService, @Inject jobService: JobService) {
        super();
        this.service = service;
        this.userService = userService;
        this.jobService = jobService;
    }

    /**
     * Transactions statistics, both startDate and endDate needs to be provided
     * @param startDate start date of transactions e.g. 2018-08-22
     * @param endDate end date of transactions, e.g. 2018-08-26
     */
    @GET
    @Path('statistics')
    @Preprocessor(BaseController.requireAdmin)
    async getStatistics(@QueryParam('startDate') startDate?: string, @QueryParam('endDate') endDate?: string): Promise<models.TransactionsStatisticsResponse> {
        const stats = await this.service.getStatistics({startDate, endDate});
        return this.map(models.TransactionsStatisticsResponse, stats);
    }

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async getTransaction(@PathParam('id') id: string): Promise<models.TransactionResponse> {
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
        if (userId && !validate(userId)) {
            throw new Errors.BadRequestError('userId must be uuid');
        }
        const filter = builder => {
            if (dateFrom && dateTill) {
                builder.whereBetween('createdAt', [dateFrom, dateTill]);
            }
            if (userId) {
                builder.where({userId});
            }
            if (status) {
                builder.where({status});
            }
            return builder;
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
    async createTransaction(data: models.TransactionRequest, @ContextRequest context: ServiceContext): Promise<models.TransactionResponse> {
        const parsedData: models.TransactionRequest = await this.validate(data, models.transactionRequestSchema);

        const user = await this.userService.get(parsedData.userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }
        user.checkTransactionAbility();

        try {
            const transactionFromDb: models.Transaction = await transaction(models.Transaction.knex(), async trx => {
                const {job: jobRequest} = parsedData;
                let jobFromDb;
                if (!jobRequest.id) {
                    const jobEntity = Job.fromJson(jobRequest);
                    jobFromDb = await this.jobService.insert(jobEntity, trx);
                } else {
                    jobFromDb = await this.jobService.get(jobRequest.id);
                }
                if (!jobFromDb) {
                    throw new Errors.NotFoundError('Job not found');
                }

                const transactionEntity = models.Transaction.fromJson(parsedData);
                transactionEntity.adminId = context['user'].id;
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
    async createTransactionTransfer(@PathParam('id') id: string, @ContextRequest context: ServiceContext): Promise<models.TransactionResponse> {
        const transaction = await this.service.get(id);
        if (!transaction) {
            throw new Errors.NotFoundError();
        }

        try {
            const user = await this.userService.get(context['user'].id);

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
            if (e instanceof models.InvalidTransferData || e instanceof Errors.NotAcceptableError) {
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
}
