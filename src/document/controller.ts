import * as _ from 'lodash';
import {DELETE, FileParam, GET, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import * as invitationsLogic from './logic';
import {DocumentResponse, PaginatedDocumentResponse} from './models';

@Security('api_key')
@Path('/documents')
@Tags('documents')
export class DocumentsController extends BaseController {
    /**
     * Endpoint to upload a document to dwolla for validation
     *
     * @param {string} type
     * @param {*} file
     * @returns {Promise<DocumentResponse>}
     * @memberof DocumentsController
     */
    @POST
    @Path('dwolla')
    @Preprocessor(BaseController.requireContractor)
    async addDwollaDocument(@QueryParam('type') type: string, @FileParam('filepond') file): Promise<DocumentResponse> {
        const logic = new invitationsLogic.AddDwollaDocumentLogic(this.getRequestContext());
        const document = await logic.execute(this.getRequestContext().getUserId(), type, file);

        return this.map(DocumentResponse, document);
    }

    /**
     * Upload a new document
     *
     * @param {string} type
     * @param {*} file
     * @returns {Promise<DocumentResponse>}
     * @memberof DocumentsController
     */
    @POST
    @Path('')
    @Preprocessor(BaseController.requireContractor)
    async addDocument(@QueryParam('type') type: string, @FileParam('filepond') file): Promise<DocumentResponse> {
        const logic = new invitationsLogic.AddDocumentLogic(this.getRequestContext());
        const document = await logic.execute(this.getRequestContext().getUserId(), type, file);

        return this.map(DocumentResponse, document);
    }

    /**
     * Get a list of the current user's documents
     *
     * @param {string} [type]
     * @param {number} [page]
     * @param {number} [limit]
     * @returns {Promise<PaginatedDocumentResponse>}
     * @memberof DocumentsController
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireContractor)
    async getDocuments(
        @QueryParam('type') type?: string,
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
    ): Promise<PaginatedDocumentResponse> {
        const logic = new invitationsLogic.GetDocumentsLogic(this.getRequestContext());
        const documentsList = await logic.execute(this.getRequestContext().getUserId(), type, page, limit);

        return this.paginate(
            documentsList.pagination,
            documentsList.rows.map(document => {
                return this.map(DocumentResponse, document);
            }),
        );
    }

    /**
     * Delete a document
     *
     * @param {string} id
     * @memberof DocumentsController
     */
    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireContractor)
    async deleteDocument(@PathParam('id') id: string) {
        const logic = new invitationsLogic.DeleteDocumentLogic(this.getRequestContext());
        await logic.execute(id);
    }

    /**
     * Create a download link for a document
     *
     * @param {string} id
     * @returns {Promise<string>}
     * @memberof DocumentsController
     */
    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireContractor)
    async getDocumentDownloadLink(@PathParam('id') id: string): Promise<string> {
        const logic = new invitationsLogic.GetDocumentDownloadLinkLogic(this.getRequestContext());
        return await logic.execute(id);
    }
}
