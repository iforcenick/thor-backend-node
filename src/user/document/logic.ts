import * as _ from 'lodash';
import {AutoWired, Inject} from 'typescript-ioc';
import {transaction} from 'objection';
import {Errors} from 'typescript-rest';
import {Logic} from '../../logic';
import * as models from './models';
import {Logger} from '../../logger';
import {UserService} from '../../user/service';
import {UserDocumentService} from './service';
import {GoogleStorage} from '../../googleStorage';
import * as dwolla from '../../dwolla';

@AutoWired
export class AddUserDocumentLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private service: UserDocumentService;
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

        let document: models.UserDocument = models.UserDocument.factory({
            tenantId: this.context.getTenantId(),
            userId,
            type,
            name: file.originalname,
        });

        return await transaction(this.service.transaction(), async trx => {
            document = await this.service.insert(document, trx);
            try {
                const result = await this.googleStorage.saveDocument(userId, document.id, file.buffer);
                if (!result) throw new Errors.InternalServerError();
                return document;
            } catch (e) {
                await this.service.delete(document, trx);
                throw new Errors.InternalServerError();
            }
        });
    }
}

@AutoWired
export class AddUserDwollaDocumentLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private service: UserDocumentService;
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

        if (user.tenantProfile.externalStatus != dwolla.customer.CUSTOMER_STATUS.Document) {
            throw new Errors.NotAcceptableError('User cannot upload documents');
        }

        const location = await this.dwollaClient.createDocument(
            user.tenantProfile.dwollaUri,
            file.buffer,
            file.originalname,
            type,
        );
        const dwollaDoc = await this.dwollaClient.getDocument(location);
        if (dwollaDoc.failureReason) throw new Errors.InternalServerError();

        let document: models.UserDocument = models.UserDocument.factory({
            tenantId: this.context.getTenantId(),
            userId,
            type,
            name: file.originalname,
        });

        return await transaction(this.service.transaction(), async trx => {
            document = await this.service.insert(document, trx);
            try {
                const result = await this.googleStorage.saveDocument(userId, document.id, file.buffer);
                if (!result) throw new Errors.InternalServerError();
                return document;
            } catch (e) {
                await this.service.delete(document, trx);
                throw new Errors.InternalServerError();
            }
        });
    }
}

@AutoWired
export class GetUserDocumentsLogic extends Logic {
    @Inject private service: UserDocumentService;

    async execute(userId: string, type: string, page, limit: number): Promise<any> {
        const filter = builder => {
            models.UserDocument.filter(builder, userId, type);
        };

        return await this.service.listPaginated(page, limit, filter);
    }
}

@AutoWired
export class DeleteUserDocumentLogic extends Logic {
    @Inject private service: UserDocumentService;
    @Inject private googleStorage: GoogleStorage;

    async execute(id: string): Promise<any> {
        const document = await this.service.get(id);
        if (!document) {
            throw new Errors.NotFoundError('Document not found');
        }

        await this.googleStorage.deleteDocument(document.userId, document.id);
        await this.service.delete(document);
    }
}

@AutoWired
export class GetUserDocumentDownloadLinkLogic extends Logic {
    @Inject private service: UserDocumentService;
    @Inject private googleStorage: GoogleStorage;

    async execute(id: string): Promise<string> {
        const document = await this.service.get(id);
        if (!document) {
            throw new Errors.NotFoundError('Document not found');
        }
        // TODO:
        return 'https://odin.gothor.com';
    }
}
