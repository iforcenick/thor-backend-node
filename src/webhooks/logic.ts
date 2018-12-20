import {AutoWired, Inject} from 'typescript-ioc';
import * as dwolla from '../dwolla';
import {Logger} from '../logger';
import {IEvent} from '../dwolla/event';
import {Logic} from '../logic';
import {RequestContext} from '../context';
import {UpdateTransactionStatusLogic} from '../transaction/logic';
import {MailerService} from '../mailer';
import {ProfileService} from '../profile/service';
import {UserService} from '../user/service';
import {FundingSourceService} from '../foundingSource/services';
import {TenantService} from '../tenant/service';
import {TransactionService} from '../transaction/service';
import {Transaction} from '../transaction/models';
import {UpdateContractorStatusLogic} from '../contractor/logic';
import {Statuses} from '../transaction/models';
import {TransferService} from '../transaction/transfer/service';
import { Profile } from '../profile/models';
import { Transfer } from '../transaction/transfer/models';

const TAG = '[dwolla-webhook]';

export class EventFactory {
    @Inject static logger: Logger;

    static get(event: IEvent, context: RequestContext): Logic {
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

                // TODO: unsupported events
                // case dwolla.event.TYPE.customerFundingSource.added:
                // case dwolla.event.TYPE.customerFundingSource.removed:
                // case dwolla.event.TYPE.customerFundingSource.verified:
                //     break;

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
    @Inject logger: Logger;

    async execute(event: IEvent): Promise<any> {
        // note: there is no tenant id in the context here
        const profile: Profile = await this.profileService.getByDwollaUri(event['_links']['customer']['href']);
        if (!profile) {
            throw new Error(`Could not find profile by dwollaUri ${event['_links']['customer']['href']}`);
        }
        // update the context with the tenant id so the rest of the db calls work
        this.context.setTenantIdOverride(profile.tenantId);

        const user = await this.userService.get(profile.userId);
        if (!user) {
            throw new Error(`Could not find user by profile ${profile.id}`);
        }

        const fundingSource = await this.fundingSourceService.getByDwollaUri(
            event['_links']['resource']['href'],
        );
        if (!fundingSource) {
            throw new Error(`Could not find funding source by dwollaUri ${event['_links']['resource']['href']}`);
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
    @Inject private transferService: TransferService;
    @Inject logger: Logger;

    async execute(event: IEvent): Promise<any> {
        // note: there is no tenant id in the context here
        const transfer: Transfer = await this.transferService.getByExternalId(event['_links']['resource']['href']);
        if (!transfer) {
            throw new Error(`Could not find transfer by dwollaUri ${event['_links']['resource']['href']}`);
        }
        // update the context with the tenant id so the rest of the db calls work
        this.context.setTenantIdOverride(transfer.tenantId);

        const transaction = await this.transactionService.getOneBy('transferId', transfer.id);
        if (!transaction) {
            throw new Error(`Could not find transaction by transferId`);
        }

        const logic = new UpdateTransactionStatusLogic(this.context);

        // transfer event order for current flow:
        // customer transfer created - send created email (done w/o event)
        // customer transfer completed
        // customer bank transfer created
        // customer bank transfer completed - send completed email
        switch (event.topic) {
            case dwolla.event.TYPE.customerTransfer.created:
                await logic.execute(transaction, transfer, Statuses.processing);
                break;

            case dwolla.event.TYPE.customerBankTransfer.completed:
                await logic.execute(transaction, transfer, Statuses.processed);
                break;

            case dwolla.event.TYPE.transfer.reclaimed:
            case dwolla.event.TYPE.customerBankTransfer.failed:
            case dwolla.event.TYPE.customerTransfer.failed:
            case dwolla.event.TYPE.transfer.failed:
                await logic.execute(transaction, transfer, Statuses.failed);
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
                await logic.execute(transaction, transfer, Statuses.cancelled);
                break;

            default:
                break;
        }
    }
}

@AutoWired
export class CustomerEventLogic extends Logic {
    @Inject private mailer: MailerService;
    @Inject userService: UserService;
    @Inject profileService: ProfileService;
    @Inject logger: Logger;

    async execute(event: IEvent): Promise<any> {
        // note: there is no tenant id in the context
        const profile: Profile = await this.profileService.getByDwollaUri(event['_links']['customer']['href']);
        if (!profile) {
            throw new Error(`Could not find profile by dwollaUri ${event['_links']['customer']['href']}`);
        }
        // update the context with the tenant id so the rest of the db calls work
        this.context.setTenantIdOverride(profile.tenantId);

        const user = await this.userService.get(profile.userId);
        if (!user) {
            throw new Error(`Could not find user by profile ${profile.id}`);
        }
        if (!user.isContractor()) {
            throw new Error(`This user is not a contractor`);
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
