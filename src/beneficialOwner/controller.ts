import {BaseController} from '../api';
import {AutoWired, Inject} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import {Path, POST, Preprocessor} from 'typescript-rest';
import {AddBeneficialOwnerRequest, AddBeneficialOwnerResponse} from './models';
import {AddBeneficialOwnerTransaction} from '../contractor/transactions';
import {Logger} from '../logger';
import {Config} from '../config';



@AutoWired
@Security('api_key')
@Path('/tenants/company')
@Tags('company', 'beneficialOwners', 'tenants')
@Preprocessor(BaseController.requireAdmin)
export abstract class BeneficialOwnerController extends BaseController {

    private addBeneficialOwnerTransaction: AddBeneficialOwnerTransaction;
    constructor(@Inject logger: Logger,
        @Inject config: Config,
        @Inject addBeneficialOwnerTransaction: AddBeneficialOwnerTransaction) {
        super(logger, config);
        this.addBeneficialOwnerTransaction = addBeneficialOwnerTransaction;
    }

    @POST
    @Path('beneficialOwners')
    async addBeneficialOwner(request: AddBeneficialOwnerRequest): Promise<AddBeneficialOwnerResponse> {
        return this.map(AddBeneficialOwnerResponse, request);
    }
}