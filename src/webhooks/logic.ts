import {AutoWired, Inject} from 'typescript-ioc';
import {RequestContext} from '../context';
import * as dwolla from '../dwolla';
import {IEvent} from '../dwolla/event';
import {Logger} from '../logger';
import {Logic} from '../logic';
import {UpdateTransactionStatusLogic as UpdateTransactionsStatusLogic} from '../transaction/logic';
import {UpdateContractorStatusLogic} from '../contractor/logic';
import {MailerService} from '../mailer';
import {Statuses, Transaction} from '../transaction/models';
import {Profile} from '../profile/models';
import {FundingSource} from '../fundingSource/models';
import {ProfileService} from '../profile/service';
import {UserService} from '../user/service';
import {FundingSourceService} from '../fundingSource/services';
import {TransactionService} from '../transaction/service';
import {TenantService} from '../tenant/service';
import {User} from '../user/models';
import {Tenant} from '../tenant/models';

const TAG = '[dwolla-webhook]';

export class EventFactory {
    @Inject static logger: Logger;

    static get(event: IEvent, context: RequestContext): Logic {
        this.logger.info(`${TAG}: ${event.topic} - ${event['_links']['resource']['href']}`);
        try {
            switch (event.topic) {
                case dwolla.event.TYPE.customer.verificationDocumentNeeded:
                case dwolla.event.TYPE.customer.verificationDocumentUploaded:
                case dwolla.event.TYPE.customer.verificationDocumentApproved:
                case dwolla.event.TYPE.customer.verificationDocumentFailed:
                case dwolla.event.TYPE.customer.reverificationNeeded:
                case dwolla.event.TYPE.customer.verified:
                case dwolla.event.TYPE.customer.created:
                case dwolla.event.TYPE.customer.suspended:
                    return new CustomerEventLogic(context);

                case dwolla.event.TYPE.customerBankTransfer.creationFailed:
                case dwolla.event.TYPE.customerBankTransfer.created:
                case dwolla.event.TYPE.customerTransfer.created:
                case dwolla.event.TYPE.transfer.created:
                case dwolla.event.TYPE.customerBankTransfer.completed:
                case dwolla.event.TYPE.customerTransfer.completed:
                case dwolla.event.TYPE.transfer.completed:
                case dwolla.event.TYPE.customerBankTransfer.failed:
                case dwolla.event.TYPE.customerTransfer.failed:
                case dwolla.event.TYPE.transfer.failed:
                case dwolla.event.TYPE.transfer.reclaimed:
                case dwolla.event.TYPE.customerBankTransfer.cancelled:
                case dwolla.event.TYPE.customerTransfer.cancelled:
                case dwolla.event.TYPE.transfer.cancelled:
                    return new CustomerTransferEventLogic(context);

                case dwolla.event.TYPE.customerFundingSource.added:
                case dwolla.event.TYPE.customerFundingSource.removed:
                case dwolla.event.TYPE.customerFundingSource.verified:
                    return new CustomerFundingSourceEventLogic(context);

                case dwolla.event.TYPE.customerBeneficialOwner.verified:
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
            // don't throw an error back at dwolla right now
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
                case dwolla.event.TYPE.customerFundingSource.added:
                    await this.mailer.sendFundingSourceAdded(user, fundingSource);
                    break;
                case dwolla.event.TYPE.customerFundingSource.removed:
                    await this.mailer.sendFundingSourceRemoved(user, fundingSource);
                    break;
                case dwolla.event.TYPE.customerFundingSource.verified:
                    await this.mailer.sendFundingSourceVerified(user, fundingSource);
                    break;
                default:
                    break;
            }
        } catch (error) {
            // don't throw an error back at dwolla if the email fails
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
            case dwolla.event.TYPE.customerTransfer.created:
                await logic.execute(transactions, Statuses.processing);
                break;

            case dwolla.event.TYPE.customerBankTransfer.completed:
                await logic.execute(transactions, Statuses.processed);
                break;

            case dwolla.event.TYPE.transfer.reclaimed:
            case dwolla.event.TYPE.customerBankTransfer.failed:
            case dwolla.event.TYPE.customerTransfer.failed:
            case dwolla.event.TYPE.transfer.failed:
                await logic.execute(transactions, Statuses.failed);
                break;

            // TODO: unsupported transfer events
            // case dwolla.event.TYPE.customerTransfer.completed:
            // case dwolla.event.TYPE.transfer.completed:
            // case dwolla.event.TYPE.customerBankTransfer.created:
            // case dwolla.event.TYPE.customerTransfer.created:
            // case dwolla.event.TYPE.transfer.created:
            // case dwolla.event.TYPE.customerBankTransfer.creationFailed:
            case dwolla.event.TYPE.customerBankTransfer.cancelled:
            case dwolla.event.TYPE.customerTransfer.cancelled:
            case dwolla.event.TYPE.transfer.cancelled:
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
            case dwolla.event.TYPE.customer.verificationDocumentNeeded:
                await logic.execute(user, dwolla.customer.CUSTOMER_STATUS.Document);
                break;
            case dwolla.event.TYPE.customer.verificationDocumentUploaded:
                await this.mailer.sendCustomerVerificationDocumentUploaded(user);
                break;
            case dwolla.event.TYPE.customer.verificationDocumentApproved:
                await this.mailer.sendCustomerVerificationDocumentApproved(user);
                break;
            case dwolla.event.TYPE.customer.verificationDocumentFailed:
                await this.mailer.sendCustomerVerificationDocumentFailed(user);
                break;
            case dwolla.event.TYPE.customer.reverificationNeeded:
                await logic.execute(user, dwolla.customer.CUSTOMER_STATUS.Retry);
                break;
            case dwolla.event.TYPE.customer.verified:
                await logic.execute(user, dwolla.customer.CUSTOMER_STATUS.Verified);
                break;
            case dwolla.event.TYPE.customer.created:
                // TODO: dwolla sends verified event before the created event...
                // TODO: move from when we create the customer
                // await this.mailer.sendCustomerCreated(user);
                break;
            case dwolla.event.TYPE.customer.suspended:
                await logic.execute(user, dwolla.customer.CUSTOMER_STATUS.Suspended);
                break;
            default:
                break;
        }
    }
}

@AutoWired
export class CustomerBeneficialOwnerEventLogic extends Logic {
    @Inject private client: dwolla.Client;
    @Inject private logger: Logger;

    async execute(event: IEvent): Promise<any> {
        switch (event.topic) {
            case dwolla.event.TYPE.customerBeneficialOwner.verificationDocumentNeeded:
            case dwolla.event.TYPE.customerBeneficialOwner.verificationDocumentUploaded:
            case dwolla.event.TYPE.customerBeneficialOwner.verificationDocumentApproved:
            case dwolla.event.TYPE.customerBeneficialOwner.verificationDocumentFailed:
            case dwolla.event.TYPE.customerBeneficialOwner.reverificationNeeded:
            case dwolla.event.TYPE.customerBeneficialOwner.created:
            case dwolla.event.TYPE.customerBeneficialOwner.removed:
                break;
            case dwolla.event.TYPE.customerBeneficialOwner.verified:
                try {
                    await this.client.certifyBusinessVerifiedBeneficialOwnership(event['_links']['customer']['href']);
                } catch (e) {
                    this.logger.error(e);
                }
                break;
            default:
                break;
        }
    }
}
