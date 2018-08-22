import {Errors, GET, Path, PathParam, POST, Preprocessor} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import * as models from './models';
import {JobService} from './service';

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
    async create(data: models.JobRequest) {
        const parsedData = await this.validate(data, models.jobRequestSchema);

        const jobModel = models.Job.fromJson(parsedData);
        try {
            const jobFromDB = await this.service.createJob(jobModel);
            return this.map(models.JobResponse, jobFromDB);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }
    }
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async getJobs(): Promise<models.PaginatedJobReponse> {
        const transactions = await this.service.list();

        return this.paginate(
            {
                total: 0,
                limit: 0,
                page: 0,
                pages: 0,
            },
            transactions.map(transaction => {
                return this.map(models.JobResponse, transaction);
            })
        );
    }
}
