import {GET, Path, QueryParam} from 'typescript-rest';
import {BaseController} from '../api';
import {Logger} from '../logger';
import {Inject} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import * as models from './models';
import {RankService} from './service';

@Security('api_key')
@Path('/ranks')
export class RankController extends BaseController {
    @Inject private logger: Logger;
    private service: RankService;

    constructor(@Inject service: RankService) {
        super();
        this.service = service;
    }

    @GET
    @Path('')
    @Tags('ranks')
    async getProfile(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
        @QueryParam('dateStart') dateStart?: string,
        @QueryParam('dateEnd') dateEnd?: string,
    ): Promise<models.PaginatedRankResponse> {
        const filter = builder => {
            if (dateStart) {
                builder.where('date', '>=', dateStart);
            }
            if (dateEnd) {
                builder.where('date', '<=', dateEnd);
            }
            return builder;
        };
        const ranks = await this.service.list(page, limit, filter);
        return this.paginate(
            ranks.pagination,
            ranks.rows.map(rank => {
                return this.map(models.RankResponse, rank);
            }),
        );
    }
}
