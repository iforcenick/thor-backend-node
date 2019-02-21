import {Provides} from 'typescript-ioc';
import {StorageClientError, StorageClient} from './client';

@Provides(StorageClient)
export class GoogleStorageClient extends StorageClient {
    private storage;
    private bucket;

    constructor() {
        super();
        this.storage = new Storage();
        this.bucket = this.storage.bucket(this.config.get('storage.bucket'));
    }

    async save(fileName: string, data: any): Promise<boolean> {
        const file = this.bucket.file(fileName);

        try {
            await file.save(data);
        } catch (e) {
            throw new StorageClientError(e);
        }

        return true;
    }

    async getDownloadLink(fileName: string): Promise<string> {
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

    async delete(fileName: string): Promise<boolean> {
        const file = this.bucket.file(fileName);

        try {
            await file.delete();
        } catch (e) {
            throw new StorageClientError(e);
        }

        return true;
    }
}
