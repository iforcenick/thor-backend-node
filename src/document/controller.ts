import * as _ from 'lodash';
import {DELETE, FileParam, GET, Path, PathParam, POST, Preprocessor, QueryParam} from 'typescript-rest';
import {Security, Tags} from 'typescript-rest-swagger';
import {BaseController} from '../api';
import * as logicLayer from './logic';
import {DocumentResponse, PaginatedDocumentResponse} from './models';
import {UserDocumentResponse, PaginatedUserDocumentResponse} from './userDocument/models';

@Security('api_key')
@Path('/documents')
@Tags('documents')
export class DocumentController extends BaseController {
    /**
     * Get a download link for a document
     *
     * @param {string} id
     * @returns {Promise<string>}
     * @memberof DocumentController
     */
    @GET
    @Path(':id')
    async getDocumentDownloadLink(@PathParam('id') id: string): Promise<string> {
        const logic = new logicLayer.GetDocumentDownloadLinkLogic(this.getRequestContext());
        return await logic.execute(id);
    }

    /**
     * Query for a list of documents
     *
     * @param {number} [page]
     * @param {number} [limit]
     * @returns {Promise<PaginatedDocumentResponse>}
     * @memberof DocumentController
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getDocuments(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
    ): Promise<PaginatedDocumentResponse> {
        const logic = new logicLayer.GetDocumentsLogic(this.getRequestContext());
        const documentList = await logic.execute(page, limit);
        return this.paginate(
            documentList.pagination,
            documentList.rows.map(document => {
                return this.map(DocumentResponse, document);
            }),
        );
    }

    /**
     * Add a document
     *
     * @param {string} id
     * @returns {Promise<string>}
     * @memberof DocumentController
     */
    @POST
    @Path('')
    @Preprocessor(BaseController.requireAdmin)
    async addDocument(@FileParam('filepond') file): Promise<DocumentResponse> {
        const logic = new logicLayer.AddDocumentLogic(this.getRequestContext());
        const document = await logic.execute(file);
        return this.map(DocumentResponse, document);
    }

    /**
     * Delete a document
     *
     * @param {string} id
     * @memberof DocumentController
     */
    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteDocument(@PathParam('id') id: string) {
        const logic = new logicLayer.DeleteDocumentLogic(this.getRequestContext());
        await logic.execute(id);
    }
}

@Security('api_key')
@Path('/contractors/documents')
@Tags('contractors', 'documents')
export class ContractorDocumentController extends BaseController {
    /**
     * Upload your document to dwolla for validation
     *
     * @param {string} type
     * @param {*} file
     * @returns {Promise<DocumentResponse>}
     * @memberof ContractorDocumentController
     */
    @POST
    @Path('dwolla')
    @Preprocessor(BaseController.requireContractor)
    async addDwollaDocument(@QueryParam('type') type: string, @FileParam('filepond') file): Promise<DocumentResponse> {
        const logic = new logicLayer.AddDwollaDocumentLogic(this.getRequestContext());
        const document = await logic.execute(this.getRequestContext().getUserId(), type, file);
        return this.map(DocumentResponse, document);
    }

    /**
     * Upload your document
     *
     * @param {string} type
     * @param {*} file
     * @returns {Promise<DocumentResponse>}
     * @memberof ContractorDocumentController
     */
    @POST
    @Path(':id')
    @Preprocessor(BaseController.requireContractor)
    async addUserDocument(@PathParam('id') id: string, @FileParam('filepond') file): Promise<DocumentResponse> {
        const logic = new logicLayer.AddUserDocumentLogic(this.getRequestContext());
        const document = await logic.execute(this.getRequestContext().getUserId(), id, file);
        return this.map(DocumentResponse, document);
    }

    /**
     * Query for a list of your user documents
     *
     * @param {number} [page]
     * @param {number} [limit]
     * @returns {Promise<PaginatedUserDocumentResponse>}
     * @memberof ContractorDocumentController
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireContractor)
    async getUserDocuments(
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
    ): Promise<PaginatedUserDocumentResponse> {
        const logic = new logicLayer.GetUserDocumentsLogic(this.getRequestContext());
        const documentList = await logic.execute(this.getRequestContext().getUserId(), page, limit);
        return this.paginate(
            documentList.pagination,
            documentList.rows.map(document => {
                return this.map(UserDocumentResponse, document);
            }),
        );
    }

    /**
     * Delete your user document
     *
     * @param {string} id
     * @memberof ContractorDocumentController
     */
    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireContractor)
    async deleteUserDocument(@PathParam('id') id: string) {
        const logic = new logicLayer.DeleteUserDocumentLogic(this.getRequestContext());
        await logic.execute(id);
    }

    /**
     * Get a download link for your user document
     *
     * @param {string} id
     * @returns {Promise<string>}
     * @memberof ContractorDocumentController
     */
    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireContractor)
    async getUserDocumentDownloadLink(@PathParam('id') id: string): Promise<string> {
        const logic = new logicLayer.GetUserDocumentDownloadLinkLogic(this.getRequestContext());
        return await logic.execute(id);
    }
}

@Security('api_key')
@Path('/users/:userId/documents')
@Tags('users', 'documents')
export class UserDocumentController extends BaseController {
    /**
     * Upload a user's document to dwolla for validation
     *
     * @param {string} userId
     * @param {string} type
     * @param {*} file
     * @returns {Promise<DocumentResponse>}
     * @memberof UserDocumentController
     */
    @POST
    @Path('dwolla')
    @Preprocessor(BaseController.requireAdmin)
    async addDwollaDocument(
        @PathParam('userId') userId: string,
        @QueryParam('type') type: string,
        @FileParam('filepond') file,
    ): Promise<DocumentResponse> {
        const logic = new logicLayer.AddDwollaDocumentLogic(this.getRequestContext());
        const document = await logic.execute(userId, type, file);
        return this.map(DocumentResponse, document);
    }

    /**
     * Upload a user's document
     *
     * @param {string} userId
     * @param {string} id
     * @param {*} file
     * @returns {Promise<DocumentResponse>}
     * @memberof UserDocumentController
     */
    @POST
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async addUserDocument(
        @PathParam('userId') userId: string,
        @PathParam('id') id: string,
        @FileParam('filepond') file,
    ): Promise<DocumentResponse> {
        const logic = new logicLayer.AddUserDocumentLogic(this.getRequestContext());
        const document = await logic.execute(userId, id, file);
        return this.map(DocumentResponse, document);
    }

    /**
     * Get a list of a user's documents
     *
     * @param {string} userId
     * @param {number} [page]
     * @param {number} [limit]
     * @returns {Promise<PaginatedUserDocumentResponse>}
     * @memberof UserDocumentController
     */
    @GET
    @Path('')
    @Preprocessor(BaseController.requireAdminReader)
    async getUserDocuments(
        @PathParam('userId') userId: string,
        @QueryParam('page') page?: number,
        @QueryParam('limit') limit?: number,
    ): Promise<PaginatedUserDocumentResponse> {
        const logic = new logicLayer.GetUserDocumentsLogic(this.getRequestContext());
        const documentList = await logic.execute(userId, page, limit);
        return this.paginate(
            documentList.pagination,
            documentList.rows.map(document => {
                return this.map(UserDocumentResponse, document);
            }),
        );
    }

    /**
     * Get a download link for a user's document
     *
     * @param {string} id
     * @returns {Promise<string>}
     * @memberof UserDocumentController
     */
    @GET
    @Path(':id')
    @Preprocessor(BaseController.requireAdminReader)
    async getUserDocumentDownloadLink(@PathParam('id') id: string): Promise<string> {
        const logic = new logicLayer.GetUserDocumentDownloadLinkLogic(this.getRequestContext());
        return await logic.execute(id);
    }

    /**
     * Delete a user's document
     *
     * @param {string} id
     * @memberof UserDocumentController
     */
    @DELETE
    @Path(':id')
    @Preprocessor(BaseController.requireAdmin)
    async deleteUserDocument(@PathParam('id') id: string) {
        const logic = new logicLayer.DeleteUserDocumentLogic(this.getRequestContext());
        await logic.execute(id);
    }
}
