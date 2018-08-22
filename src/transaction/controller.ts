import {Errors, GET, Path, PathParam, POST, Preprocessor} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {TransactionService} from './service';
import {UserService} from '../user/service';
import {JobService} from '../job/service';

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
    async getTransaction(@PathParam('id') id: string): Promise<models.TransactionResponse> {
        const transaction = await this.service.get(id);
        if (!transaction) {
            throw new Errors.NotFoundError;
        }

        return this.map(models.TransactionResponse, transaction);
    }

    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async getTransactions(): Promise<models.PaginatedTransactionReponse> {
        const transactions = await this.service.list();

        return this.paginate({
            'total': 0,
            'limit': 0,
            'page': 0,
            'pages': 0,
        }, transactions.map((transaction) => {
            return this.map(models.TransactionResponse, transaction);
        }));
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
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