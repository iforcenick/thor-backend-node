import {Errors, GET, Path, POST, PATCH, DELETE, PathParam, Preprocessor, QueryParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {JobService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';
import {TransactionResponse} from '../transaction/models';
import {CreateJobLogic, UpdateJobLogic, DeleteJobLogic} from './logic';

@Security('api_key')
@Path('/jobs')
export class JobController extends BaseController {
    @Inject private service: JobService;

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('jobs')
    async create(data: models.JobRequest): Promise<models.JobResponse> {
        const parsedData: models.JobRequest = await this.validate(data, models.jobRequestSchema);
        const logic = new CreateJobLogic(this.getRequestContext());
        const job = await logic.execute(parsedData);

        return this.map(TransactionResponse, job);
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('jobs')
    async getJobs(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('isActive') isActive?: boolean,
    ): Promise<models.PaginatedJobResponse> {
        this.service.setRequestContext(this.getRequestContext());

        const filter = builder => {
            models.Job.filter(builder, isActive);
        };
        const jobs = await this.service.listPaginated(page, limit, filter);

        return this.paginate(
            jobs.pagination,
            jobs.rows.map(job => {
                return this.map(models.JobResponse, job);
            }),
        );
    }

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('jobs')
    async getJob(@PathParam('id') id: string): Promise<models.PaginatedJobResponse> {
        this.service.setRequestContext(this.getRequestContext());

        const job = await this.service.get(id);
        if (!job) {
            throw new Errors.NotFoundError('Job not found');
        }

        return this.map(models.JobResponse, job);
    }

    @PATCH
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('jobs')
    async update(@PathParam('id') id: string, data: models.JobPatchRequest): Promise<models.JobResponse> {
        const parsedData: models.JobPatchRequest = await this.validate(data, models.jobPatchRequestSchema);
        const logic = new UpdateJobLogic(this.getRequestContext());
        const job = await logic.execute(id, parsedData);

        return this.map(models.JobResponse, job);
    }

    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('jobs')
    async delete(@PathParam('id') id: string) {
        const logic = new DeleteJobLogic(this.getRequestContext());
        await logic.execute(id);
    }
}
