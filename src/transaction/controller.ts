import {
    ContextRequest,
    Errors,
    GET,
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
import {Job} from '../job/models';

const validate = require('uuid-validate');

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
     * @param userId user id as uuidv4 string
     * @param status transaction status
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('transactions')
    async getTransactions(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('dateFrom') dateFrom?: Date,
        @QueryParam('dateTill') dateTill?: Date,
        @QueryParam('userId') userId?: string,
        @QueryParam('status') status?: string,
    ): Promise<models.PaginatedTransactionResponse> {
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
    @Tags('transactions')
    async createTransaction(
        data: models.TransactionRequest,
        @ContextRequest context: ServiceContext,
    ): Promise<models.TransactionResponse> {
        const parsedData = await this.validate(data, models.transactionRequestSchema);
        let job = parsedData['job'];
        if (!job['id']) {
            delete job['id'];
            const jobEntity = Job.fromJson(job);
            job = await this.jobService.createJob(jobEntity);
        }
        job = await this.jobService.get(job.id);
        if (!job) {
            throw new Errors.NotFoundError('Job not found');
        }
        const user = await this.userService.get(parsedData['userId']);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }
        delete parsedData['job'];
        let transaction = models.Transaction.fromJson(parsedData);

        try {
            transaction.jobId = job.id;
            transaction.adminId = context['user'].id;
            transaction = await this.service.createTransaction(transaction);
            transaction = await this.service.get(transaction.id);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }

        return this.map(models.TransactionResponse, transaction);
    }

    @POST
    @Path(':id/transfer')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('transactions')
    async createTransactionTransfer(
        @PathParam('id') id: string,
        @ContextRequest context: ServiceContext,
    ): Promise<models.TransactionResponse> {
        const transaction = await this.service.get(id);
        if (!transaction) {
            throw new Errors.NotFoundError();
        }

        try {
            const user = await this.userService.get(context['user'].id);

            if (!transaction.transferId) {
                try {
                    await this.service.prepareTransfer(transaction, user);
                } catch (e) {
                    if (e instanceof models.InvalidTransferData) {
                        throw new Errors.NotAcceptableError(e.message);
                    }

                    throw e;
                }
            } else {
                transaction.transfer = await this.service.transferService.get(transaction.transferId);
            }

            if (transaction.transfer.status !== transfer.Statuses.new) {
                throw new Errors.NotAcceptableError('Transfer already pending');
            }

            await this.service.createExternalTransfer(transaction);
        } catch (e) {
            this.logger.error(e);
            throw new Errors.InternalServerError(e.message);
        }

        return this.map(models.TransactionResponse, transaction);
    }
}
