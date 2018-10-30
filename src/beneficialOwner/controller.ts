import {BaseController} from '../api';
import {AutoWired, Inject} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import {GET, Path, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {AddBeneficialOwnerRequest, AddBeneficialOwnerResponse} from './models';
import {AddBeneficialOwnerTransaction, GetBeneficialOwnerTransaction} from '../contractor/transactions';
import {Logger} from '../logger';
import {Config} from '../config';
import {TenantContext} from '../context';
import * as models from '../job/models';
import {Paginated, Pagination} from '../db';


@AutoWired
@Security('api_key')
@Path('/tenants/company')
@Tags('company', 'beneficialOwners', 'tenants')
@Preprocessor(BaseController.requireAdmin)
export abstract class BeneficialOwnerController extends BaseController {

    private tenantContext: TenantContext;
    private addBeneficialOwnerTransaction: AddBeneficialOwnerTransaction;
    private getBeneficialOwnerTransaction: GetBeneficialOwnerTransaction;

    constructor(@Inject logger: Logger,
                @Inject config: Config,
                @Inject addBeneficialOwnerTransaction: AddBeneficialOwnerTransaction,
                @Inject tenantContext: TenantContext,
                @Inject getBeneficialOwnerTransaction: GetBeneficialOwnerTransaction) {
        super(logger, config);
        this.addBeneficialOwnerTransaction = addBeneficialOwnerTransaction;
        this.getBeneficialOwnerTransaction = getBeneficialOwnerTransaction;
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

    @GET
    @Path('beneficialOwners')
    async getBeneficialOwner(@QueryParam('page') page?: number, @QueryParam('limit') limit?: number) {
        try {
            const beneficialOwners = await this.getBeneficialOwnerTransaction.execute(this.tenantContext.get());

            const pagination = new Pagination(page, limit, beneficialOwners.length);

            return this.paginate(pagination, beneficialOwners);
        } catch (e) {
            throw e;
        }
    }

}