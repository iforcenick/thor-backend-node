import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import {Storage} from '@google-cloud/storage';
import {Config} from '../config';

@Singleton
@AutoWired
export class StorageClient {
    @Inject private config: Config;
    private storage;
    private bucket;

    constructor() {
        this.storage = new Storage();
        this.bucket = this.storage.bucket(this.config.get('storage.bucket'));
    }

    private async _save(fileName: string, data: any): Promise<boolean> {
        const file = this.bucket.file(fileName);

        try {
            await file.save(data);
        } catch (e) {
            throw new StorageClientError(e);
        }

        return true;
    }

    private async _getDownloadLink(fileName: string): Promise<string> {
        const file = this.bucket.file(fileName);

        const options = {
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // one hour
        };

        try {
            const [url] = await file.getSignedUrl(options);
            return url;
        } catch (e) {
            throw new StorageClientError(e);
        }
    }

    private async _delete(fileName: string): Promise<boolean> {
        const file = this.bucket.file(fileName);

        try {
            await file.delete();
        } catch (e) {
            throw new StorageClientError(e);
        }

        return true;
    }

    public async saveDocument(fileName: string, data: any) {
        fileName = `documents/${fileName}`;
        return await this._save(fileName, data);
    }

    public async getDocumentDownloadLink(fileName: string) {
        fileName = `documents/${fileName}`;
        return await this._getDownloadLink(fileName);
    }

    public async deleteDocument(fileName: string) {
        fileName = `documents/${fileName}`;
        return await this._delete(fileName);
    }

    public async saveUserDocument(fileName: string, data: any) {
        fileName = `users/documents/${fileName}`;
        return await this._save(fileName, data);
    }

    public async getUserDocumentDownloadLink(fileName: string) {
        fileName = `users/documents/${fileName}`;
        return await this._getDownloadLink(fileName);
    }

    public async deleteUserDocument(fileName: string) {
        fileName = `users/documents/${fileName}`;
        return await this._delete(fileName);
    }
}

export class StorageClientError extends Error {}
