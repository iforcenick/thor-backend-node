import {BaseController} from '../api';
import {AutoWired, Inject} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import {Path, POST, Preprocessor} from 'typescript-rest';
import {AddBeneficialOwnerRequest, AddBeneficialOwnerResponse} from './models';
import {AddBeneficialOwnerTransaction} from '../contractor/transactions';
import {Logger} from '../logger';
import {Config} from '../config';
import {TenantContext} from '../context';



@AutoWired
@Security('api_key')
@Path('/tenants/company')
@Tags('company', 'beneficialOwners', 'tenants')
@Preprocessor(BaseController.requireAdmin)
export abstract class BeneficialOwnerController extends BaseController {

    private tenantContext: TenantContext;
    private addBeneficialOwnerTransaction: AddBeneficialOwnerTransaction;
    constructor(@Inject logger: Logger,
                @Inject config: Config,
                @Inject addBeneficialOwnerTransaction: AddBeneficialOwnerTransaction,
                @Inject tenantContext: TenantContext) {
        super(logger, config);
        this.addBeneficialOwnerTransaction = addBeneficialOwnerTransaction;
        this.tenantContext = tenantContext;
    }

    @POST
    @Path('beneficialOwners')
    async addBeneficialOwner(request: AddBeneficialOwnerRequest): Promise<AddBeneficialOwnerResponse> {

       try {
           const beneficialOwner = await this.addBeneficialOwnerTransaction.execute(request, this.tenantContext.get());
           return this.map(AddBeneficialOwnerResponse, beneficialOwner);
       } catch (e) {
           throw e;
       }
    }
}