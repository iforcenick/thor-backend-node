import * as _ from 'lodash';
import {AutoWired, Inject} from 'typescript-ioc';
import {transaction} from 'objection';
import {Errors} from 'typescript-rest';
import {Logic} from '../logic';
import {Document} from './models';
import {Logger} from '../logger';
import {UserService} from '../user/service';
import {DocumentService} from './service';
import {GoogleStorage} from './client';
import * as dwolla from '../dwolla';

@AutoWired
export class AddDocumentLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private documentService: DocumentService;
    @Inject protected logger: Logger;
    @Inject private googleStorage: GoogleStorage;

    async execute(userId: string, type: string, file: any) {
        if (!file) {
            throw new Errors.NotAcceptableError('File missing');
        }

        if (!type) {
            throw new Errors.NotAcceptableError('Type missing');
        }

        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        let document: Document = Document.factory({
            tenantId: this.context.getTenantId(),
            userId,
            type,
            name: file.originalname,
        });

        return await transaction(this.documentService.transaction(), async trx => {
            document = await this.documentService.insert(document, trx);
            try {
                const result = await this.googleStorage.saveDocument(userId, document.id, file.buffer);
                if (!result) throw new Errors.InternalServerError('failed to save document');
                return document;
            } catch (e) {
                await this.documentService.delete(document, trx);
                throw new Errors.InternalServerError(e);
            }
        });
    }
}

@AutoWired
export class AddDwollaDocumentLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private documentService: DocumentService;
    @Inject protected logger: Logger;
    @Inject private googleStorage: GoogleStorage;
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

        let document: Document = Document.factory({
            tenantId: this.context.getTenantId(),
            userId,
            type,
            name: file.originalname,
        });

        return await transaction(this.documentService.transaction(), async trx => {
            document = await this.documentService.insert(document, trx);
            try {
                const result = await this.googleStorage.saveDocument(userId, document.id, file.buffer);
                if (!result) throw new Errors.InternalServerError('failed to save document');
                return document;
            } catch (e) {
                await this.documentService.delete(document, trx);
                throw new Errors.InternalServerError(e);
            }
        });
    }
}

@AutoWired
export class GetDocumentsLogic extends Logic {
    @Inject private documentService: DocumentService;

    async execute(userId: string, type: string, page, limit: number): Promise<any> {
        const filter = builder => {
            Document.filter(builder, userId, type);
        };

        return await this.documentService.listPaginated(page, limit, filter);
    }
}

@AutoWired
export class DeleteDocumentLogic extends Logic {
    @Inject private documentService: DocumentService;
    @Inject private googleStorage: GoogleStorage;

    async execute(id: string): Promise<any> {
        const document = await this.documentService.get(id);
        if (!document) {
            throw new Errors.NotFoundError('Document not found');
        }

        await this.googleStorage.deleteDocument(document.userId, document.id);
        await this.documentService.delete(document);
    }
}

@AutoWired
export class GetDocumentDownloadLinkLogic extends Logic {
    @Inject private documentService: DocumentService;
    @Inject private googleStorage: GoogleStorage;

    async execute(id: string): Promise<string> {
        const document = await this.documentService.get(id);
        if (!document) {
            throw new Errors.NotFoundError('Document not found');
        }
        // TODO:
        return 'https://odin.gothor.com';
    }
}
