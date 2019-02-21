import {StorageClient} from './client';

export class SandboxStorageClient extends StorageClient {
    async save(_fileName: string, _data: any): Promise<boolean> {
        return true;
    }
    async getDownloadLink(_fileName: string): Promise<string> {
        return 'https://gothor.com';
    }
    async delete(_fileName: string): Promise<boolean> {
        return true;
    }
}
