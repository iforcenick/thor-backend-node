import {AutoWired, Inject} from 'typescript-ioc';
import {RequestContext} from '../context';
import {IEvent} from '../payment/event';
import {Logger} from '../logger';
import {Logic} from '../logic';
import {UpdateTransactionStatusLogic as UpdateTransactionsStatusLogic} from '../transaction/logic';
import {UpdateContractorStatusLogic} from '../contractor/logic';
import {MailerService} from '../mailer';
import {Statuses, Transaction} from '../transaction/models';
import {Profile} from '../profile/models';
import {FundingSource} from '../fundingSource/models';
import * as payments from '../payment';
import {ProfileService} from '../profile/service';
import {UserService} from '../user/service';
import {FundingSourceService} from '../fundingSource/services';
import {TransactionService} from '../transaction/service';
import {TenantService} from '../tenant/service';
import {User} from '../user/models';
import {Tenant} from '../tenant/models';

const TAG = '[payments-webhook]';

export class EventFactory {
    @Inject static logger: Logger;

    static get(event: IEvent, context: RequestContext): Logic {
        this.logger.info(`${TAG}: ${event.topic} - ${event['_links']['resource']['href']}`);
        try {
            switch (event.topic) {
                case payments.events.TYPE.customer.verificationDocumentNeeded:
                case payments.events.TYPE.customer.verificationDocumentUploaded:
                case payments.events.TYPE.customer.verificationDocumentApproved:
                case payments.events.TYPE.customer.verificationDocumentFailed:
                case payments.events.TYPE.customer.reverificationNeeded:
                case payments.events.TYPE.customer.verified:
                case payments.events.TYPE.customer.created:
                case payments.events.TYPE.customer.suspended:
                    return new CustomerEventLogic(context);

                case payments.events.TYPE.customerBankTransfer.creationFailed:
                case payments.events.TYPE.customerBankTransfer.created:
                case payments.events.TYPE.customerTransfer.created:
                case payments.events.TYPE.transfer.created:
                case payments.events.TYPE.customerBankTransfer.completed:
                case payments.events.TYPE.customerTransfer.completed:
                case payments.events.TYPE.transfer.completed:
                case payments.events.TYPE.customerBankTransfer.failed:
                case payments.events.TYPE.customerTransfer.failed:
                case payments.events.TYPE.transfer.failed:
                case payments.events.TYPE.transfer.reclaimed:
                case payments.events.TYPE.customerBankTransfer.cancelled:
                case payments.events.TYPE.customerTransfer.cancelled:
                case payments.events.TYPE.transfer.cancelled:
                    return new CustomerTransferEventLogic(context);

                case payments.events.TYPE.customerFundingSource.added:
                case payments.events.TYPE.customerFundingSource.removed:
                case payments.events.TYPE.customerFundingSource.verified:
                    return new CustomerFundingSourceEventLogic(context);

                case payments.events.TYPE.customerBeneficialOwner.verified:
                    return new CustomerBeneficialOwnerEventLogic(context);

                default:
                    this.logger.warn(
                        `${TAG} Received unrecognized event eventTopic:'${event.topic} eventId:${
                            event.id
                        }' eventResourceId: ${event.resourceId}`,
                    );
                    break;
            }
        } catch (error) {
            this.logger.error(`${TAG} ${error.message}`);
            // don't throw an error back at payments right now
            throw error;
        }
    }
}

@AutoWired
export class CustomerFundingSourceEventLogic extends Logic {
    @Inject private mailer: MailerService;
    @Inject private userService: UserService;
    @Inject private profileService: ProfileService;
    @Inject private fundingSourceService: FundingSourceService;
    @Inject private tenantService: TenantService;
    @Inject private logger: Logger;

    async execute(event: IEvent): Promise<any> {
        // note: tenant context is not available here

        // get the funding source using the payments provider uri
        let fundingSource: FundingSource = await this.fundingSourceService.getByPaymentsUri(
            event['_links']['resource']['href'],
        );

        let tenant: Tenant;
        let user: User;
        if (!fundingSource) {
            tenant = await this.tenantService.getByFundingSourceUri(event['_links']['resource']['href']);
            if (!tenant) {
                throw new Error(
                    `Could not find funding source by payments uri: ${event['_links']['resource']['href']}`,
                );
            }
        }

        // get the contractor or admin profile to send the notice
        if (tenant) {
            user = User.factory({});
            user.baseProfile = Profile.factory({
                email: tenant.email,
                firstName: tenant.firstName,
                lastName: tenant.lastName,
            });
            fundingSource = FundingSource.factory({
                name: tenant.fundingSourceName,
                type: 'checking',
                createdAt: new Date(),
            });
        } else {
            const profile = await this.profileService.getForAllTenants(fundingSource.profileId);
            if (!profile) {
                throw new Error(`Could not find profile by payments uri: ${event['_links']['customer']['href']}`);
            }
            user = await this.userService.getForAllTenants(profile.userId);
            if (!user) {
                throw new Error(`Could not find user by profile`);
            }
        }

        try {
            switch (event.topic) {
                case payments.events.TYPE.customerFundingSource.added:
                    await this.mailer.sendFundingSourceAdded(user, fundingSource);
                    break;
                case payments.events.TYPE.customerFundingSource.removed:
                    await this.mailer.sendFundingSourceRemoved(user, fundingSource);
                    break;
                case payments.events.TYPE.customerFundingSource.verified:
                    await this.mailer.sendFundingSourceVerified(user, fundingSource);
                    break;
                default:
                    break;
            }
        } catch (error) {
            // don't throw an error back at payments if the email fails
            this.logger.error(`${TAG} ${error.message}`);
        }
    }
}

/**
 * Handle an update to a transfer
 *
 * @export
 * @class CustomerTransferEventLogic
 * @extends {Logic}
 */
@AutoWired
export class CustomerTransferEventLogic extends Logic {
    @Inject private transactionService: TransactionService;

    async execute(event: IEvent): Promise<any> {
        // note: there is no tenant id in the context here
        const transactions: Array<Transaction> = await this.transactionService.getByTransferPaymentsUri(
            event['_links']['resource']['href'],
        );
        if (transactions.length === 0) {
            throw new Error(`Could not find transactions by payments uri: ${event['_links']['resource']['href']}`);
        }
        this.context.setTenantIdOverride(transactions[0].tenantId);
        const logic = new UpdateTransactionsStatusLogic(this.context);

        // transfer event order for current flow:
        // customer transfer created - send created email
        // customer transfer completed
        // customer bank transfer created
        // customer bank transfer completed - send completed email
        switch (event.topic) {
            case payments.events.TYPE.customerTransfer.created:
                await logic.execute(transactions, Statuses.processing);
                break;

            case payments.events.TYPE.customerBankTransfer.completed:
                await logic.execute(transactions, Statuses.processed);
                break;

            case payments.events.TYPE.transfer.reclaimed:
            case payments.events.TYPE.customerBankTransfer.failed:
            case payments.events.TYPE.customerTransfer.failed:
            case payments.events.TYPE.transfer.failed:
                await logic.execute(transactions, Statuses.failed);
                break;

            // TODO: unsupported transfer events
            // case payments.events.TYPE.customerTransfer.completed:
            // case payments.events.TYPE.transfer.completed:
            // case payments.events.TYPE.customerBankTransfer.created:
            // case payments.events.TYPE.customerTransfer.created:
            // case payments.events.TYPE.transfer.created:
            // case payments.events.TYPE.customerBankTransfer.creationFailed:
            case payments.events.TYPE.customerBankTransfer.cancelled:
            case payments.events.TYPE.customerTransfer.cancelled:
            case payments.events.TYPE.transfer.cancelled:
                await logic.execute(transactions, Statuses.cancelled);
                break;

            default:
                break;
        }
    }
}

@AutoWired
export class CustomerEventLogic extends Logic {
    @Inject private mailer: MailerService;
    @Inject private userService: UserService;
    @Inject private profileService: ProfileService;

    async execute(event: IEvent): Promise<any> {
        // note: there is no tenant id in the context
        const profile: Profile = await this.profileService.getByPaymentsUri(event['_links']['customer']['href']);
        if (!profile) {
            throw new Error(`Could not find profile by paymentsUri ${event['_links']['customer']['href']}`);
        }
        const user = await this.userService.getForAllTenants(profile.userId);
        if (!user) {
            throw new Error(`Could not find user by profile ${profile.id}`);
        }

        const logic = new UpdateContractorStatusLogic(this.context);

        // TODO: don't return an error if the mailer fails

        // some events are only passed on to the users
        // others trigger updates to the status'
        switch (event.topic) {
            case payments.events.TYPE.customer.verificationDocumentNeeded:
                await logic.execute(user, payments.customers.CUSTOMER_STATUS.Document);
                break;
            case payments.events.TYPE.customer.verificationDocumentUploaded:
                await this.mailer.sendCustomerVerificationDocumentUploaded(user);
                break;
            case payments.events.TYPE.customer.verificationDocumentApproved:
                await this.mailer.sendCustomerVerificationDocumentApproved(user);
                break;
            case payments.events.TYPE.customer.verificationDocumentFailed:
                await this.mailer.sendCustomerVerificationDocumentFailed(user);
                break;
            case payments.events.TYPE.customer.reverificationNeeded:
                await logic.execute(user, payments.customers.CUSTOMER_STATUS.Retry);
                break;
            case payments.events.TYPE.customer.verified:
                await logic.execute(user, payments.customers.CUSTOMER_STATUS.Verified);
                break;
            case payments.events.TYPE.customer.created:
                // TODO: payments sends verified event before the created event...
                // TODO: move from when we create the customer
                // await this.mailer.sendCustomerCreated(user);
                break;
            case payments.events.TYPE.customer.suspended:
                await logic.execute(user, payments.customers.CUSTOMER_STATUS.Suspended);
                break;
            default:
                break;
        }
    }
}

@AutoWired
export class CustomerBeneficialOwnerEventLogic extends Logic {
    @Inject private paymentClient: payments.PaymentClient;
    @Inject private logger: Logger;

    async execute(event: IEvent): Promise<any> {
        switch (event.topic) {
            case payments.events.TYPE.customerBeneficialOwner.verificationDocumentNeeded:
            case payments.events.TYPE.customerBeneficialOwner.verificationDocumentUploaded:
            case payments.events.TYPE.customerBeneficialOwner.verificationDocumentApproved:
            case payments.events.TYPE.customerBeneficialOwner.verificationDocumentFailed:
            case payments.events.TYPE.customerBeneficialOwner.reverificationNeeded:
            case payments.events.TYPE.customerBeneficialOwner.created:
            case payments.events.TYPE.customerBeneficialOwner.removed:
                break;
            case payments.events.TYPE.customerBeneficialOwner.verified:
                try {
                    await this.paymentClient.certifyBusinessVerifiedBeneficialOwnership(
                        event['_links']['customer']['href'],
                    );
                } catch (e) {
                    this.logger.error(e);
                }
                break;
            default:
                break;
        }
    }
}
