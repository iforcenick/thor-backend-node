import {Path, PathParam, POST} from 'typescript-rest';
import {BaseController} from '../api';
import * as models from '../user/models';
import * as Errors from '../../node_modules/typescript-rest/dist/server-errors';
import {Inject} from 'typescript-ioc';
import {Logger} from '../logger';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {TransactionService} from '../transaction/service';

@Path('/demo')
export class DemoController extends BaseController {

    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;
    private service: UserService;
    private profileService: ProfileService;
    private transactionService: TransactionService;

    constructor(@Inject service: UserService,
                @Inject profileService: ProfileService,
                @Inject transactionService: TransactionService) {
        super();
        this.service = service;
        this.profileService = profileService;
        this.transactionService = transactionService;
    }


    @POST
    @Path(':id/fundingSourceDemo')
    async createUserFundingSourceDemo(@PathParam('id') id: string, data: models.FundingSourceRequest) {
        const parsedData = await this.validate(data, models.fundingSourceRequestSchema);
        const user = await this.service._get(id);
        if (!user) {
            throw new Errors.NotFoundError();
        }

        const profile = user.tenantProfile;

        try {
            await this.dwollaClient.authorize();
            profile.dwollaSourceUri = await this.dwollaClient.createFundingSource(
                profile.dwollaUri,
                parsedData['routingNumber'],
                parsedData['accountNumber'],
                'checking',
                'default',
            );

            profile.dwollaRouting = parsedData['routingNumber'];
            profile.dwollaAccount = parsedData['accountNumber'];
            await this.service.profileService.update(profile);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.InternalServerError(err.message);
        }
    }
}

