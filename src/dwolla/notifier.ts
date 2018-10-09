import {MailerService} from '../mailer';
import * as dwolla from './index';
import {Logger} from '../logger';
import {User} from '../user/models';
import {AutoWired, Inject} from 'typescript-ioc';


@AutoWired
export class DwollaNotifier {
    private mailer: MailerService;
    private dwollaClient: dwolla.Client;
    private logger: Logger;

    constructor(@Inject mailer: MailerService, @Inject dwollaClient: dwolla.Client, @Inject logger: Logger) {
        this.dwollaClient = dwollaClient;
        this.mailer = mailer;
        this.logger = logger;
    }

    async sendNotificationForDwollaCustomer(user: User, status: string) {
        switch (status) {
            case dwolla.customer.CUSTOMER_STATUS.Retry:
                await this.mailer.sendCustomerVerificationRetry(user, user);
                break;
            case dwolla.customer.CUSTOMER_STATUS.Document:
                await this.mailer.sendCustomerVerificationDocument(user, user);
                break;
            case dwolla.customer.CUSTOMER_STATUS.Suspended:
                await this.mailer.sendCustomerVerificationSuspended(user, user);
                break;
            // default:
            //     throw new RangeError('Invalid status, ' + status + ' is out of range');
        }
    }
}