import {Container, Scope} from 'typescript-ioc';
import {Config} from './config';
import {PaymentClient} from './payment';
import {SandboxPaymentClient} from './payment/sandbox';
import {SandboxStorageClient} from './storage/sandbox';
import {StorageClient} from './storage';

export default class SandboxIoC {
    static configure() {
        if (Config.isSandbox()) {
            Container.bind(StorageClient).to(SandboxStorageClient);
            Container.bind(PaymentClient).to(SandboxPaymentClient).scope(Scope.Singleton);
        }
    }
}
