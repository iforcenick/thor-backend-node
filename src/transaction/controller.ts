import {Errors, GET, Param, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {TransactionService} from './service';
import {UserService} from '../user/service';
import {JobService} from '../job/service';
import {Security, Tags} from 'typescript-rest-swagger';

@Security('api_key')
@Path('/transactions')
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

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('transactions')
    async getTransaction(@PathParam('id') id: string): Promise<models.TransactionResponse> {
        const transaction = await this.service.get(id);
        if (!transaction) {
            throw new Errors.NotFoundError;
        }

        return this.map(models.TransactionResponse, transaction);
    }

    /**
     * Transactions can be filtered by createdAt date, both dateFrom and dateTill needs to be provided
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     * @param dateFrom starting Date() of transactions e.g. 2018-08-22T14:44:27.727Z
     * @param dateTill end Date() of transactions, e.g. 2018-08-22T14:44:27.727Z
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('transactions')
    async getTransactions(@QueryParam('page') page?: number, @QueryParam('limit') limit?: number,
                          @QueryParam('dateFrom') dateFrom?: Date, @QueryParam('dateTill') dateTill?: Date): Promise<models.PaginatedTransactionReponse> {
        let filter;

        if (dateFrom && dateTill) {
            filter = (builder) => {
                builder.whereBetween('createdAt', [dateFrom, dateTill]);
            };
        }

        const transactions = await this.service.list(page, limit, filter);

        return this.paginate(transactions.pagination, transactions.rows.map((transaction) => {
            return this.map(models.TransactionResponse, transaction);
        }));
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('transactions')
    async createTransaction(data: models.TransactionRequest): Promise<models.TransactionResponse> {
        const parsedData = await this.validate(data, models.transactionRequestSchema);
        let transaction = models.Transaction.fromJson(parsedData);
        const user = await this.userService.get(transaction.userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        const job = await this.jobService.get(transaction.jobId);
        if (!job) {
            throw new Errors.NotFoundError('Job not found');
        }

        try {
            transaction = await this.service.createTransaction(transaction);
            transaction = await this.service.get(transaction.id);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        transaction.job = job;

        return this.map(models.TransactionResponse, transaction);
    }
}