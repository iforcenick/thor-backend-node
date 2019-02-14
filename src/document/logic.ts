import * as _ from 'lodash';
import {transaction} from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import uuidv4 from 'uuid/v4';
import {Paginated, Pagination} from '../db';
import * as dwolla from '../dwolla';
import {Logic} from '../logic';
import {Document} from './models';
import {UserDocument, Statuses} from './userDocument/models';
import {ApiServer} from '../server';
import {UserService} from '../user/service';
import {DocumentService} from './service';
import {StorageClient} from '../storage';
import {UserDocumentService} from './userDocument/service';

// create a unique file name with the original extention
const createFileName = originalName => {
    return `${uuidv4()}.${originalName.split('.').pop()}`;
};

@AutoWired
export class AddDocumentLogic extends Logic {
    @Inject private documentService: DocumentService;
    @Inject private storageClient: StorageClient;

    async execute(file: any, isRequired: boolean = true): Promise<Document> {
        if (!file) {
            throw new Errors.NotAcceptableError('File missing');
        }

        let document: Document = Document.factory({
            tenantId: this.context.getTenantId(),
            isRequired,
            name: file.originalname,
            fileName: createFileName(file.originalname),
        });

        return await transaction(this.documentService.transaction(), async trx => {
            document = await this.documentService.insert(document, trx);
            await this.storageClient.saveDocument(document.fileName, file.buffer);
            return document;
        });
    }
}

@AutoWired
export class GetDocumentsLogic extends Logic {
    @Inject private documentService: DocumentService;

    async execute(page, limit: number): Promise<Paginated<Document>> {
        return await this.documentService.listPaginated(page, limit);
    }
}

@AutoWired
export class DeleteDocumentLogic extends Logic {
    @Inject private documentService: DocumentService;
    @Inject private storageClient: StorageClient;

    async execute(id: string): Promise<any> {
        const document = await this.documentService.get(id);
        if (!document) {
            throw new Errors.NotFoundError('Document not found');
        }

        await this.storageClient.deleteDocument(document.fileName);
        document.deletedAt = new Date();
        await this.documentService.update(document);
    }
}

@AutoWired
export class GetDocumentDownloadLinkLogic extends Logic {
    @Inject private documentService: DocumentService;
    @Inject private storageClient: StorageClient;

    async execute(id: string): Promise<string> {
        const document = await this.documentService.get(id);
        if (!document) {
            throw new Errors.NotFoundError('Document not found');
        }
        return await this.storageClient.getDocumentDownloadLink(document.fileName);
    }
}

@AutoWired
export class AddUserDocumentLogic extends Logic {
    @Inject private documentService: DocumentService;
    @Inject private userDocumentService: UserDocumentService;
    @Inject private storageClient: StorageClient;

    async execute(userId: string, documentId: string, file: any): Promise<Document> {
        if (!file) {
            throw new Errors.NotAcceptableError('File missing');
        }

        const document: Document = await this.documentService.get(documentId);
        if (!document) {
            throw new Errors.NotFoundError('Document not found');
        }

        let userDocument: UserDocument = UserDocument.factory({
            userId,
            tenantId: document.tenantId,
            fileName: createFileName(file.originalname),
            documentId,
            status: Statuses.approved,
        });

        return await transaction(this.userDocumentService.transaction(), async trx => {
            userDocument = await this.userDocumentService.insert(userDocument, trx);
            await this.storageClient.saveUserDocument(userDocument.fileName, file.buffer);
            return userDocument;
        });
    }
}

@AutoWired
export class AddDwollaDocumentLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private dwollaClient: dwolla.Client;

    async execute(userId: string, type: string, file: any) {
        if (!file) {
            throw new Errors.NotAcceptableError('File missing');
        }

        if (!_.has(dwolla.documents.TYPE, type)) {
            throw new Errors.ConflictError('Invalid type');
        }

        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        if (user.baseProfile.paymentsStatus != dwolla.customer.CUSTOMER_STATUS.Document) {
            throw new Errors.NotAcceptableError('User cannot upload documents');
        }

        const location = await this.dwollaClient.createDocument(
            user.baseProfile.paymentsUri,
            file.buffer,
            file.originalname,
            type,
        );
        const dwollaDoc = await this.dwollaClient.getDocument(location);
        if (dwollaDoc.failureReason) throw new Errors.InternalServerError(dwollaDoc.failureReason);
    }
}

@AutoWired
export class GetDwollaDocumentsLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private dwollaClient: dwolla.Client;

    async execute(userId: string) {
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }
        const dwollaDocuments = await this.dwollaClient.listDocuments(user.baseProfile.paymentsUri);
        return dwollaDocuments;
    }
}

@AutoWired
export class GetUserDocumentsLogic extends Logic {
    @Inject private documentService: DocumentService;

    async execute(userId: string, page, limit: number): Promise<any> {
        const knex = ApiServer.db;
        const query = this.documentService
            .query()
            .column(
                'usersDocuments.id',
                {documentId: 'documents.id'},
                'name',
                'status',
                'isRequired',
                'documents.createdAt',
            )
            .select()
            .from('documents')
            .fullOuterJoin('usersDocuments', _query => {
                _query
                    .on('documents.id', '=', 'usersDocuments.documentId')
                    .andOn('usersDocuments.userId', '=', knex.raw('?', [userId]));
            })
            .whereNull('documents.deletedAt')
            .andWhere('documents.tenantId', this.context.getTenantId())
            .andWhere(_query => {
                _query.where('usersDocuments.userId', userId).orWhereNull('usersDocuments.id');
            });
        const pag = this.documentService.addPagination(query, page, limit);
        const result = await query;
        return new Paginated(new Pagination(pag.page, pag.limit, result.total), result.results);
    }
}

@AutoWired
export class DeleteUserDocumentLogic extends Logic {
    @Inject private userDocumentService: UserDocumentService;
    @Inject private storageClient: StorageClient;

    async execute(id: string): Promise<any> {
        const userDocument = await this.userDocumentService.get(id);
        if (!userDocument) {
            throw new Errors.NotFoundError('User document not found');
        }

        await transaction(this.userDocumentService.transaction(), async trx => {
            await this.userDocumentService.delete(userDocument, trx);
            await this.storageClient.deleteUserDocument(userDocument.fileName);
        });
    }
}

@AutoWired
export class GetUserDocumentDownloadLinkLogic extends Logic {
    @Inject private userDocumentService: UserDocumentService;
    @Inject private storageClient: StorageClient;

    async execute(id: string): Promise<string> {
        const document = await this.userDocumentService.get(id);
        if (!document) {
            throw new Errors.NotFoundError('Document not found');
        }
        return await this.storageClient.getUserDocumentDownloadLink(document.fileName);
    }
}
