import {BaseController} from '../api';
import {AutoWired} from 'typescript-ioc';
import {Security, Tags} from 'typescript-rest-swagger';
import {DELETE, GET, PATCH, Path, PathParam, POST, Preprocessor, QueryParam, HttpError, PUT} from 'typescript-rest';
import {
    AddBeneficialOwnerRequest,
    addBeneficialOwnerRequestSchema,
    BeneficialOwnerResponse,
    EditBeneficialOwnerRequest,
    editBeneficialOwnerRequestSchema,
    EditBeneficialOwnerResponse,
    PaginatedBeneficialOwnerResponse, RetryBeneficialOwnerRequest, retryBeneficialOwnerRequestSchema
} from './models';
import {
    AddBeneficialOwnerLogic, AddBeneficialOwnerRetryLogic,
    DeleteBeneficialOwnerLogic,
    EditBeneficialOwnerLogic,
    GetBeneficialOwnerLogic,
    GetBeneficialOwnersLogic
} from './logic';
import {Pagination} from '../db';
import * as dwolla from '../dwolla';
import * as Errors from 'typescript-rest/dist/server-errors';


@AutoWired
@Security('api_key')
@Path('/tenants/company')
@Tags('tenantCompany')
export abstract class BeneficialOwnerController extends BaseController {
    @POST
    @Path('beneficialOwners')
    @Preprocessor(BaseController.requireAdmin)
    async addBeneficialOwner(request: AddBeneficialOwnerRequest): Promise<BeneficialOwnerResponse> {
        const validateResult: AddBeneficialOwnerRequest = await this.validate(request, addBeneficialOwnerRequestSchema);
        try {
            const logic = new AddBeneficialOwnerLogic(this.getRequestContext());
            const beneficialOwner = await logic.execute(validateResult, this.getRequestContext().getTenantId());
            return this.map(BeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError(null, null);
            }

            if (err instanceof HttpError) {
                throw err;
            }

            throw new Errors.InternalServerError(err.message);
        }
    }

    @PUT
    @Path('beneficialOwners')
    @Preprocessor(BaseController.requireAdmin)
    async retryBeneficialOwner(request: RetryBeneficialOwnerRequest): Promise<any> {
        const validateResult: RetryBeneficialOwnerRequest = await this.validate(request, retryBeneficialOwnerRequestSchema);
        try {
            const retryLogic = new AddBeneficialOwnerRetryLogic(this.getRequestContext());
            const beneficialOwner = await retryLogic.execute(validateResult, this.getRequestContext().getTenantId());
            return this.map(BeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError(null, null);
            }

            if (err instanceof HttpError) {
                throw err;
            }
            throw new Errors.InternalServerError(err.message);
        }
    }

    @PATCH
    @Path('beneficialOwners')
    @Preprocessor(BaseController.requireAdmin)
    async editBeneficialOwner(request: EditBeneficialOwnerRequest): Promise<EditBeneficialOwnerResponse> {
        const validateResult: EditBeneficialOwnerRequest = await this.validate(request, editBeneficialOwnerRequestSchema);
        try {
            const logic = new EditBeneficialOwnerLogic(this.getRequestContext());
            const beneficialOwner = await logic.execute(validateResult);
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
    @Preprocessor(BaseController.requireAdminReader)
    async getBeneficialOwners(@QueryParam('page') page?: number, @QueryParam('limit') limit?: number): Promise<PaginatedBeneficialOwnerResponse> {
        try {
            if (!page) {
                page = 1;
            }

            if (!limit) {
                limit = 5;
            }

            const logic = new GetBeneficialOwnersLogic(this.getRequestContext());
            const beneficialOwners = await logic.execute(this.getRequestContext().getTenantId());
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
    @Preprocessor(BaseController.requireAdminReader)
    async getBeneficialOwner(@PathParam('id') id: string): Promise<BeneficialOwnerResponse> {
        try {
            const logic = new GetBeneficialOwnerLogic(this.getRequestContext());
            const beneficialOwner = await logic.execute(id);
            return this.map(BeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }

    @DELETE
    @Path('beneficialOwners/:id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteBeneficialOwner(@PathParam('id') id: string) {
        try {
            const logic = new DeleteBeneficialOwnerLogic(this.getRequestContext());
            await logic.execute(id);
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }
}