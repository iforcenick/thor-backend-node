import {Errors, GET, Path, POST, PATCH, DELETE, PathParam, Preprocessor, QueryParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {JobService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';
import * as logicLayer from './logic';
import * as db from '../db';
import {NotAcceptableError} from 'typescript-rest/dist/server-errors';
import {JobListLogic} from './logic';

@Security('api_key')
@Path('/jobs')
@Tags('jobs')
export class JobController extends BaseController {
    @Inject private service: JobService;

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async create(data: models.JobRequest): Promise<models.JobResponse> {
        const parsedData: models.JobRequest = await this.validate(data, models.jobRequestSchema);
        const logic = new logicLayer.CreateJobLogic(this.getRequestContext());
        const job = await logic.execute(parsedData);

        return this.map(models.JobResponse, job);
    }

    /**
     * @param page page to be queried, starting from 0
     * @param limit transactions per page
     * @param isActive
     * @param isCustom
     * @param name
     * @param orderBy
     * @param order
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getJobs(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('isActive') isActive?: boolean,
        @QueryParam('isCustom') isCustom?: boolean,
        @QueryParam('name') name?: string,
        @QueryParam('orderBy') orderBy?: string,
        @QueryParam('order') order?: string,
    ): Promise<models.PaginatedJobResponse> {

        if (orderBy && !JobListLogic.sortableFields.includes(orderBy)) {
            throw new NotAcceptableError(`Invalid orderBy, allowed order by ${JobListLogic.sortableFields.join(', ')}`);
        }

        const searchCriteria = new logicLayer.SearchCriteria();
        searchCriteria.name = name;
        searchCriteria.orderBy = orderBy;
        if (order) {
            searchCriteria.order = db.parseOrdering(order);
        }
        searchCriteria.page = page;
        searchCriteria.limit = limit;
        searchCriteria.isActive = isActive;
        searchCriteria.isCustom = isCustom;

        const jobListLogic = new logicLayer.JobListLogic(this.getRequestContext());
        const jobs = await jobListLogic.execute(searchCriteria);

        return this.paginate(
            jobs.pagination,
            jobs.rows.map(job => {
                return this.map(models.JobResponse, job);
            }),
        );
    }

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdminReader)
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
    async update(@PathParam('id') id: string, data: models.JobPatchRequest): Promise<models.JobResponse> {
        const parsedData: models.JobPatchRequest = await this.validate(data, models.jobPatchRequestSchema);
        const logic = new logicLayer.UpdateJobLogic(this.getRequestContext());
        const job = await logic.execute(id, parsedData);

        return this.map(models.JobResponse, job);
    }

    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async delete(@PathParam('id') id: string) {
        const logic = new logicLayer.DeleteJobLogic(this.getRequestContext());
        await logic.execute(id);
    }
}
