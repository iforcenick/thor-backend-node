import {Errors, GET, HttpError, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {JobService} from './service';
import {Security, Tags} from 'typescript-rest-swagger';

@Security('api_key')
@Path('/jobs')
export class JobController extends BaseController {
    @Inject private logger: Logger;
    private service: JobService;

    constructor(@Inject service: JobService) {
        super();
        this.service = service;
    }

    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    @Tags('jobs')
    async create(data: models.JobRequest): Promise<models.JobResponse> {
        const parsedData = await this.validate(data, models.jobRequestSchema);
        const jobModel = models.Job.fromJson(parsedData);
        try {
            const jobFromDB = await this.service.insert(jobModel);
            return this.map(models.JobResponse, jobFromDB);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }
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
    ): Promise<models.PaginatedJobResponse> {
        const jobs = await this.service.list(page, limit);

        return this.paginate(
            jobs.pagination,
            jobs.rows.map(job => {
                return this.map(models.JobResponse, job);
            }),
        );
    }
}
