import {BaseController} from '../api';
import {AutoWired, Inject} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import {DELETE, GET, PATCH, Path, PathParam, POST, Preprocessor, PUT, QueryParam} from 'typescript-rest';
import {
    AddBeneficialOwnerRequest,
    addBeneficialOwnerRequestSchema,
    BeneficialOwnerResponse,
    EditBeneficialOwnerRequest, editBeneficialOwnerRequestSchema, EditBeneficialOwnerResponse,
    PaginatedBeneficialOwnerResponse
} from './models';
import {
    AddBeneficialOwnerLogic, GetBeneficialOwnersLogic,
    GetBeneficialOwnerLogic, DeleteBeneficialOwnerLogic
} from './logic';
import {Logger} from '../logger';
import {Config} from '../config';
import {TenantContext} from '../context';
import {Paginated, Pagination} from '../db';
import * as dwolla from '../dwolla';
import * as Errors from 'typescript-rest/dist/server-errors';


@AutoWired
@Security('api_key')
@Path('/tenants/company')
@Tags('company', 'beneficialOwners', 'tenants')
@Preprocessor(BaseController.requireAdmin)
export abstract class BeneficialOwnerController extends BaseController {
    private tenantContext: TenantContext;
    private addBeneficialOwnerTransaction: AddBeneficialOwnerLogic;
    private getBeneficialOwnersLogic: GetBeneficialOwnersLogic;
    private getBeneficialOwnerLogic: GetBeneficialOwnerLogic;
    private deleteBeneficialOwnerLogic: DeleteBeneficialOwnerLogic;

    constructor(@Inject logger: Logger,
                @Inject config: Config,
                @Inject addBeneficialOwnerTransaction: AddBeneficialOwnerLogic,
                @Inject tenantContext: TenantContext,
                @Inject deleteBeneficialOwnerLogic: DeleteBeneficialOwnerLogic,
                @Inject getBeneficialOwnerLogic: GetBeneficialOwnerLogic,
                @Inject getBeneficialOwnersLogic: GetBeneficialOwnersLogic) {
        super(logger, config);
        this.addBeneficialOwnerTransaction = addBeneficialOwnerTransaction;
        this.getBeneficialOwnersLogic = getBeneficialOwnersLogic;
        this.getBeneficialOwnerLogic = getBeneficialOwnerLogic;
        this.deleteBeneficialOwnerLogic = deleteBeneficialOwnerLogic;
        this.tenantContext = tenantContext;
    }

    @POST
    @Path('beneficialOwners')
    async addBeneficialOwner(request: AddBeneficialOwnerRequest): Promise<BeneficialOwnerResponse> {
        const validateResult: AddBeneficialOwnerRequest = await this.validate(request, addBeneficialOwnerRequestSchema);
        try {
            const beneficialOwner = await this.addBeneficialOwnerTransaction.execute(validateResult, this.tenantContext.get());
            return this.map(BeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError(null, null);
            }
            throw new Errors.InternalServerError(err.message);
        }
    }

    @PATCH
    @Path('beneficialOwners')
    async editBeneficialOwner(request: EditBeneficialOwnerRequest): Promise<EditBeneficialOwnerResponse> {
        const validateResult: EditBeneficialOwnerRequest = await this.validate(request, editBeneficialOwnerRequestSchema);
        try {
            const beneficialOwner = await this.addBeneficialOwnerTransaction.execute(validateResult, this.tenantContext.get());
            return this.map(EditBeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError(null, null);
            }
            throw new Errors.InternalServerError(err.message);
        }
    }

    @GET
    @Path('beneficialOwners')
    async getBeneficialOwners(@QueryParam('page') page?: number, @QueryParam('limit') limit?: number): Promise<PaginatedBeneficialOwnerResponse> {
        try {
            const beneficialOwners = await this.getBeneficialOwnersLogic.execute(this.tenantContext.get());
            const pagination = new Pagination(page, limit, beneficialOwners.length);

            return this.paginate(
                pagination,
                beneficialOwners.map(owner => {
                    return this.map(BeneficialOwnerResponse, owner);
                })
            );
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }

    @GET
    @Path('beneficialOwners/:id')
    async getBeneficialOwner(@PathParam('id') id: string): Promise<BeneficialOwnerResponse> {
        try {
            const beneficialOwner = await this.getBeneficialOwnerLogic.execute(id);
            return this.map(BeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }

    @DELETE
    @Path('beneficialOwners/:id')
    async deleteBeneficialOwner(@PathParam('id') id: string) {
        try {
            await this.deleteBeneficialOwnerLogic.execute(id);
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }
}