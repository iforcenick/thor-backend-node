import {Inject, AutoWired} from 'typescript-ioc';
import {Storage} from '@google-cloud/storage';
import {Config} from '../config';
import {Logger} from '../logger';
import {Document} from './models';

@AutoWired
export class GoogleStorage {
    @Inject protected config: Config;
    @Inject protected logger: Logger;
    private storage;
    private bucket;

    constructor() {
        this.storage = new Storage();
        this.bucket = this.storage.bucket(this.config.get('storage.bucket'));
    }

    /* istanbul ignore next */
    private _save(file, data, callback) {
        file.save(data, callback);
    }

    async saveDocument(document: Document, data: any): Promise<boolean> {
        const location = `users/${document.userId}/documents/${document.id}_${document.name}`;
        const file = this.bucket.file(location);

        try {
            await new Promise((resolve, reject) => {
                this._save(file, data, err => {
                    if (err) {
                        this.logger.error(err);
                        reject(err);
                    }
                    resolve(true);
                });
            });
        } catch (e) {
            throw new GoogleStorageClientError(e);
        }

        return true;
    }

    async getDocument(document: Document): Promise<string> {
        const location = `users/${document.userId}/documents/${document.id}_${document.name}`;
        const file = this.bucket.file(location);

        const options = {
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // one hour
        };

        try {
            const [url] = await file.getSignedUrl(options);
            return url;
        } catch (e) {
            throw new GoogleStorageClientError(e);
        }
    }

    async deleteDocument(document: Document): Promise<any> {
        const location = `users/${document.userId}/documents/${document.id}_${document.name}`;
        const file = this.bucket.file(location);

        try {
            await file.delete();
        } catch (e) {
            throw new GoogleStorageClientError(e);
        }

        return true;
    }
}

export class GoogleStorageClientError extends Error {}
