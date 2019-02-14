import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import {Container} from 'typescript-ioc';
import * as storage from './index';
import {sandbox} from '../test-setup.spec.unit';

chai.use(chaiAsPromised);
const expect = chai.expect;

const storageClient: storage.StorageClient = Container.get(storage.StorageClient);

describe('Storage client', () => {
    /*
    describe('creation', () => {
        it('should have Google Storage client', async () => {
            expect((storageClient as any)).to.be.an.instanceof(storage.StorageClient);
        });
    });

    describe('save document', () => {
        it('should return true', async () => {
            const client = (storageClient as any);
            sandbox.stub(client, 'saveDocument').returns(Promise.resolve(true));
            expect(await client.saveDocument('document.txt', 'text')).to.be.true;
        });
    });

    describe('get document download link', () => {
        it('should return a url string', async () => {
            const client = (storageClient as any);
            sandbox.stub(client, 'getDocumentDownloadLink').returns(Promise.resolve(true));
            expect(await client.getDocumentDownloadLink('document.txt')).not.to.be.null;
        });
    });

    describe('delete document', () => {
        it('should return true', async () => {
            const client = (storageClient as any);
            sandbox.stub(client, 'deleteDocument').returns(Promise.resolve(true));
            expect(await client.deleteDocument('document.txt')).to.be.true;
        });
    });

    describe('save user document', () => {
        it('should return true', async () => {
            const client = (storageClient as any);
            sandbox.stub(client, 'saveUserDocument').returns(Promise.resolve(true));
            expect(await client.saveUserDocument('document.txt', 'text')).to.be.true;
        });
    });

    describe('get user document download link', () => {
        it('should return a url string', async () => {
            const client = (storageClient as any);
            sandbox.stub(client, 'getUserDocumentDownloadLink').returns(Promise.resolve(true));
            expect(await client.getUserDocumentDownloadLink('document.txt')).not.to.be.null;
        });
    });

    describe('delete user document', () => {
        it('should return true', async () => {
            const client = (storageClient as any);
            sandbox.stub(client, 'deleteUserDocument').returns(Promise.resolve(true));
            expect(await client.deleteUserDocument('document.txt')).to.be.true;
        });
    });
    */
});
