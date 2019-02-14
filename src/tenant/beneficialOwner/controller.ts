import {AutoWired} from 'typescript-ioc';
import {DELETE, GET, PATCH, Path, PathParam, POST, Preprocessor, QueryParam, HttpError, PUT} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import * as Errors from 'typescript-rest/dist/server-errors';
import {BaseController} from '../../api';
import {Pagination} from '../../db';
import * as dwolla from '../../dwolla';
import * as logicLayer from './logic';
import * as models from './models';

@AutoWired
@Security('api_key')
@Path('/tenants/company/beneficialOwners')
@Tags('tenant', 'company', 'beneficialOwners')
export abstract class BeneficialOwnerController extends BaseController {
    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async addBeneficialOwner(request: models.AddBeneficialOwnerRequest): Promise<models.BeneficialOwnerResponse> {
        const validateResult: models.AddBeneficialOwnerRequest = await this.validate(
            request,
            models.addBeneficialOwnerRequestSchema,
        );
        try {
            const logic = new logicLayer.AddBeneficialOwnerLogic(this.getRequestContext());
            const beneficialOwner = await logic.execute(validateResult, this.getRequestContext().getTenantId());
            return this.map(models.BeneficialOwnerResponse, beneficialOwner);
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
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async retryBeneficialOwner(request: models.RetryBeneficialOwnerRequest): Promise<any> {
        const validateResult: models.RetryBeneficialOwnerRequest = await this.validate(
            request,
            models.retryBeneficialOwnerRequestSchema,
        );
        try {
            const retryLogic = new logicLayer.AddBeneficialOwnerRetryLogic(this.getRequestContext());
            const beneficialOwner = await retryLogic.execute(validateResult, this.getRequestContext().getTenantId());
            return this.map(models.BeneficialOwnerResponse, beneficialOwner);
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
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async editBeneficialOwner(request: models.EditBeneficialOwnerRequest): Promise<models.EditBeneficialOwnerResponse> {
        const validateResult: models.EditBeneficialOwnerRequest = await this.validate(
            request,
            models.editBeneficialOwnerRequestSchema,
        );
        try {
            const logic = new logicLayer.EditBeneficialOwnerLogic(this.getRequestContext());
            const beneficialOwner = await logic.execute(validateResult);
            return this.map(models.EditBeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
                throw err.toValidationError(null, null);
            }
            throw new Errors.InternalServerError(err.message);
        }
    }

    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getBeneficialOwners(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
    ): Promise<models.PaginatedBeneficialOwnerResponse> {
        try {
            if (!page) {
                page = 1;
            }

            if (!limit) {
                limit = 5;
            }

            const logic = new logicLayer.GetBeneficialOwnersLogic(this.getRequestContext());
            const beneficialOwners = await logic.execute(this.getRequestContext().getTenantId());
            const pagination = new Pagination(page, limit, beneficialOwners.length);

            return this.paginate(
                pagination,
                beneficialOwners.map(owner => {
                    return this.map(models.BeneficialOwnerResponse, owner);
                }),
            );
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }

    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdminReader)
    async getBeneficialOwner(@PathParam('id') id: string): Promise<models.BeneficialOwnerResponse> {
        try {
            const logic = new logicLayer.GetBeneficialOwnerLogic(this.getRequestContext());
            const beneficialOwner = await logic.execute(id);
            return this.map(models.BeneficialOwnerResponse, beneficialOwner);
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }

    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteBeneficialOwner(@PathParam('id') id: string) {
        try {
            const logic = new logicLayer.DeleteBeneficialOwnerLogic(this.getRequestContext());
            await logic.execute(id);
        } catch (err) {
            throw new Errors.InternalServerError(err.message);
        }
    }
}
