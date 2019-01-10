import {Inject, AutoWired} from 'typescript-ioc';
import {Storage} from '@google-cloud/storage';
import {Config} from './config';
import {Logger} from './logger';

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
    /* istanbul ignore next */
    private _get(file, callback) {
        file.get(callback);
    }
    /* istanbul ignore next */
    private _delete(file, callback) {
        file.delete(callback);
    }

    async saveDocument(userId: string, fileName: string, data: any): Promise<boolean> {
        const location = `users/${userId}/documents/${fileName}`;
        const file = this.bucket.file(location);

        try {
            await new Promise((resolve, reject) => {
                this._save(file, data, err => {
                    if (err) {
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

    async getDocument(userId: string, fileName: string): Promise<any> {
        const location = `users/${userId}/documents/${fileName}`;
        const file = this.bucket.file(location);

        try {
            await new Promise((resolve, reject) => {
                this._get(file, data => {
                    if (data) {
                        reject();
                    }
                    resolve(data[0]);
                });
            });
        } catch (e) {
            throw new GoogleStorageClientError(e);
        }

        return true;
    }

    async deleteDocument(userId: string, fileName: string): Promise<any> {
        const location = `users/${userId}/documents/${fileName}`;
        const file = this.bucket.file(location);

        try {
            await new Promise((resolve, reject) => {
                this._delete(file, (err, apiResponse) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(apiResponse);
                });
            });
        } catch (e) {
            throw new GoogleStorageClientError(e);
        }

        return true;
    }
}

export class GoogleStorageClientError extends Error {}
