import {AutoWired, Inject} from 'typescript-ioc';
import {Config} from '../config';
import {Logger} from '../logger';

@AutoWired
export abstract class StorageClient {
    @Inject protected config: Config;
    @Inject protected logger: Logger;

    abstract async save(fileName: string, data: any): Promise<boolean>;
    abstract async getDownloadLink(fileName: string): Promise<string>;
    abstract async delete(fileName: string): Promise<boolean>;

    public async saveDocument(fileName: string, data: any) {
        fileName = `documents/${fileName}`;
        return await this.save(fileName, data);
    }

    public async getDocumentDownloadLink(fileName: string) {
        fileName = `documents/${fileName}`;
        return await this.getDownloadLink(fileName);
    }

    public async deleteDocument(fileName: string) {
        fileName = `documents/${fileName}`;
        return await this.delete(fileName);
    }

    public async saveUserDocument(fileName: string, data: any) {
        fileName = `users/documents/${fileName}`;
        return await this.save(fileName, data);
    }

    public async getUserDocumentDownloadLink(fileName: string) {
        fileName = `users/documents/${fileName}`;
        return await this.getDownloadLink(fileName);
    }

    public async deleteUserDocument(fileName: string) {
        fileName = `users/documents/${fileName}`;
        return await this.delete(fileName);
    }
}

export class StorageClientError extends Error {}
