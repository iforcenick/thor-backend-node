import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import * as user from '../user/models';
import * as transfer from './transfer/models';
import {TransferService} from './transfer/service';
import * as dwolla from '../dwolla';
import {TenantService} from '../tenant/service';
import {UserService} from '../user/service';
import {transaction} from 'objection';

const knex = require('knex');

@AutoWired
export class TransactionService extends db.ModelService<models.Transaction> {
    @Inject private dwollaClient: dwolla.Client;
    protected modelType = models.Transaction;
    public transferService: TransferService;
    protected tenantService: TenantService;
    protected userService: UserService;

    constructor(
        @Inject transferService: TransferService,
        @Inject tenantService: TenantService,
        @Inject userService: UserService,
    ) {
        super();
        this.transferService = transferService;
        this.userService = userService;
        this.tenantService = tenantService;
    }

    async tenantContext(query) {
        return await query.where('transactions.tenantId', this.getTenantId());
    }
    getOptions(query) {
        query
            .eager(
                {
                    [models.Relations.job]: {$modify: ['tenant']},
                    [models.Relations.user]: {
                        $modify: ['user'],
                        [user.Relations.profile]: {
                            $modify: ['profile'],
                        },
                    },
                },
                {
                    tenant: builder => {
                        builder.where('tenantId', this.getTenantId());
                    },
                    profile: builder => {
                        builder.where('tenantId', this.getTenantId()).select(['firstName', 'lastName']);
                    },
                    user: builder => {
                        builder.select('');
                    },
                },
            )
            .join('jobs', 'transactions.jobId', 'jobs.id')
            .select(['transactions.*'], knex.raw('transactions.quantity * jobs.value as value'));

        return query;
    }

    async getForUser(
        {page = 0, limit}: { page?: number; limit?: number },
        {userId, startDate, endDate, status}: { userId: string; startDate?: string; endDate?: string; status?: string },
    ) {
        limit = this.paginationLimit(limit);
        const query = this.modelType.query();
        query.where({userId});
        query.page(page, limit);
        const eagerObject = {
            job: {$modify: ['job']},
        };
        const eagerFilters = {
            job: builder => {
                builder.select(['id', 'value', 'name', 'description']);
            },
        };
        if (startDate && endDate) {
            query.whereRaw('"transactions"."createdAt" between ? and ( ? :: timestamptz + INTERVAL \'1 day\')', [
                startDate,
                endDate,
            ]);
        }
        if (status) {
            query.where('transactions.status', status);
        }
        query.eager(eagerObject, eagerFilters);
        const result = await this.tenantContext(query);
        return new db.Paginated(new db.Pagination(page, limit, result.total), result.results);
    }
    getListOptions(query) {
        return this.getOptions(query);
    }

    async createTransaction(transaction: models.Transaction): Promise<models.Transaction> {
        transaction.tenantId = this.getTenantId();
        transaction.status = models.Statuses.new;
        return await this.insert(transaction);
    }

    async prepareTransfer(_transaction: models.Transaction, admin: user.User): Promise<transfer.Transfer> {
        const tenant = await this.tenantService.get(_transaction.tenantId);
        const user = await this.userService.get(_transaction.userId);

        if (!user.tenantProfile.dwollaSourceUri) {
            throw new models.InvalidTransferData('Bank account not configured for recipient');
        }
        let _transfer = new transfer.Transfer();
        _transfer.adminId = admin.id;
        _transfer.status = transfer.Statuses.new;
        _transfer.destinationUri = user.tenantProfile.dwollaSourceUri;
        _transfer.sourceUri = tenant.dwollaUri;
        _transfer.value = Number(_transaction.value);
        _transaction.status = models.Statuses.processing;
        delete _transaction.value;
        await transaction(this.transaction(), async trx => {
            _transfer = await this.transferService.createTransfer(_transfer, trx);
            await _transfer.$relatedQuery(transfer.Relations.transaction, trx).relate(_transaction.id);
            await this.update(_transaction, trx);
        });
        _transaction.transfer = _transfer;

        return _transfer;
    }

    async createExternalTransfer(_transaction: models.Transaction) {
        await this.dwollaClient.authorize();
        const dwollaTransfer = dwolla.transfer.factory({});
        dwollaTransfer.setSource(_transaction.transfer.sourceUri);
        dwollaTransfer.setDestination(_transaction.transfer.destinationUri);
        dwollaTransfer.setAmount(_transaction.transfer.value);
        dwollaTransfer.setCurrency('USD');
        _transaction.transfer.externalId = await this.dwollaClient.createTransfer(dwollaTransfer);
        // TODO: check if there's an event sent to webhook with transfer status, for verified user it looks like transfer is instantly marked as processed

        await transaction(this.transaction(), async trx => {
            _transaction.transfer.status = transfer.Statuses.externalProcessing;
            await this.transferService.update(_transaction.transfer, trx);
        });
    }
}
