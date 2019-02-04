import {Logic} from '../logic';
import {Errors} from 'typescript-rest';
import {AutoWired, Inject} from 'typescript-ioc';
import {JobService} from './service';
import {transaction, Transaction} from 'objection';
import * as models from './models';
import {Job, JobRequest, JobPatchRequest} from './models';
import * as _ from 'lodash';
import {BaseError} from '../api';
import {TransactionService} from '../transaction/service';
import {Paginated} from '../db';
import * as db from '../db';

@AutoWired
export class CreateJobLogic extends Logic {
    @Inject private jobService: JobService;

    async execute(data: JobRequest, isCustom: boolean = false, trx?: Transaction): Promise<Job> {
        return await transaction(this.jobService.transaction(trx), async _trx => {
            const jobEntity = Job.factory({
                ...data,
                isActive: true,
                isCustom,
            });

            return await this.jobService.insert(jobEntity, _trx);
        });
    }
}

@AutoWired
export class UpdateJobLogic extends Logic {
    @Inject private jobService: JobService;

    async execute(id: string, data: JobPatchRequest): Promise<any> {
        const jobFromDb = await this.jobService.get(id);
        if (!jobFromDb) {
            throw new Errors.NotFoundError('Job not found');
        }

        jobFromDb.merge(data);
        await this.jobService.update(jobFromDb);

        return jobFromDb;
    }
}

@AutoWired
export class DeleteJobLogic extends Logic {
    @Inject private jobService: JobService;
    @Inject private transactionService: TransactionService;

    async execute(id: string): Promise<any> {
        const job = await this.jobService.get(id);
        if (!job) {
            throw new Errors.NotFoundError();
        }

        const hasTransactions = await this.transactionService.hasTransaction(job.id);
        if (hasTransactions) {
            job.isActive = false;
            await this.jobService.update(job);
        } else {
            await this.jobService.delete(job);
        }
    }
}

export class ChargeTenantError extends BaseError {}

@AutoWired
export class JobListLogic extends Logic {
    public static sortableFields: string[] = ['value', 'createdAt'];

    @Inject private service: JobService;

    async execute(searchCriteria: SearchCriteria): Promise<Paginated<Job>> {
        const filter = builder => {
            models.Job.filter(builder, searchCriteria.name, searchCriteria.isActive, searchCriteria.isCustom);
        };

        let options;
        if (!searchCriteria.orderBy) {
            searchCriteria.orderBy = 'createdAt';
            searchCriteria.order = db.Ordering.desc;
        }
        options = builder => {
            models.Job.orderBy(builder, searchCriteria.orderBy, searchCriteria.order);
        };
        const jobs = await this.service.listPaginated(searchCriteria.page, searchCriteria.limit, filter, options);

        return jobs;
    }
}

export class SearchCriteria {
    public page: number;
    public limit: number;
    public isActive?: boolean;
    public isCustom?: boolean;
    public name?: string;
    public orderBy?: string;
    public order: string = db.Ordering.desc;
}
