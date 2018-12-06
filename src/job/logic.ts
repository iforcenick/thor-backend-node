import {Logic} from '../logic';
import {Errors} from 'typescript-rest';
import {AutoWired, Inject} from 'typescript-ioc';
import {JobService} from './service';
import {transaction} from 'objection';
import * as models from './models';
import * as users from '../user/models';
import {Transaction} from '../transaction/models';
import {Job, JobRequest, JobPatchRequest} from './models';
import * as _ from 'lodash';
import {BaseError} from '../api';
import {FundingSourceService} from '../foundingSource/services';
import {UserService} from '../user/service';
import {TransactionService} from '../transaction/service';
import {Tenant} from '../tenant/models';

@AutoWired
export class CreateJobLogic extends Logic {
    @Inject private jobService: JobService;

    async execute(data: JobRequest): Promise<any> {
        return await transaction(models.Job.knex(), async trx => {
            const jobEntity = Job.factory(data);
            jobEntity.isActive = true;
            const jobFromDb = await this.jobService.insert(jobEntity, trx);

            return jobFromDb;
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