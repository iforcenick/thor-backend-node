import * as _ from 'lodash';
import * as objection from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import * as dwolla from '../dwolla';
import {Logger} from '../logger';
import {Logic} from '../logic';
import {MailerService} from '../mailer';
import {User} from '../user/models';
import {Statuses} from '../profile/models';
import {Transaction} from '../transaction/models';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {TransactionService} from '../transaction/service';

@AutoWired
export class AddContractorOnRetryStatusLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private userService: UserService;

    async execute(profileData: any, tenantId, userId: string) {
        this.userService.setTenantId(tenantId);
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        // TODO: verify the status is correct for retry

        // update the profile data for both tenant and base profiles
        user.baseProfile.merge(profileData);
        user.tenantProfile.merge(profileData);

        // update the payments (dwolla) account with the profile data
        const customer = dwolla.customer.factory(profileData);
        customer.type = dwolla.customer.TYPE.Personal;
        const updateableFields = customer.updateableFields();
        await this.dwollaClient.updateCustomer(user.baseProfile.paymentsUri, updateableFields);
        const dwollaCustomer = await this.dwollaClient.getCustomer(user.baseProfile.paymentsUri);
        user.baseProfile.paymentsType = dwollaCustomer.type;

        // update the status and send emails in necessary
        const logic = new UpdateContractorStatusLogic(this.context);
        return await logic.execute(user, dwollaCustomer.status);
    }
}

/**
 * create a new contractor profile from an invitation
 *
 * @export
 * @class AddInvitedContractorLogic
 * @extends {Logic}
 */
@AutoWired
export class CreateContractorLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private mailerService: MailerService;
    @Inject private logger: Logger;

    async execute(profileData: any) {
        const user = await this.userService.get(this.context.getUserId());
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }
        profileData.status = Statuses.document;
        user.tenantProfile.merge(profileData);

        // if the user hasn't had a payments account created for them yet:
        // 1) update their base (payments) profile with the profile data
        // 2) create a payments (dwolla) account for them
        // 3) update the base and tenant profiles
        let status = user.baseProfile.paymentsStatus;
        if (!user.baseProfile.paymentsUri) {
            user.baseProfile.merge(profileData);
            const customer = dwolla.customer.factory(profileData);
            customer.type = dwolla.customer.TYPE.Personal;
            user.baseProfile.paymentsUri = await this.dwollaClient.createCustomer(customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(user.baseProfile.paymentsUri);
            status = dwollaCustomer.status;
            user.baseProfile.paymentsType = dwollaCustomer.type;
        }

        // send the customer created email
        try {
            await this.mailerService.sendCustomerCreated(user);
        } catch (error) {
            this.logger.error(error);
        }

        // update the status and send emails in necessary
        // Note: this will take care of updating the profiles as well
        const logic = new UpdateContractorStatusLogic(this.context);
        return await logic.execute(user, status);
    }
}

@AutoWired
export class UpdateContractorStatusLogic extends Logic {
    @Inject private profileService: ProfileService;
    @Inject private mailerService: MailerService;
    @Inject private logger: Logger;

    async execute(user: User, status: string, trx?: objection.Transaction): Promise<any> {
        // only send an email for a changed status
        if (user.baseProfile.paymentsStatus === status) return;

        // sync all of the users profiles with the updated payment account status
        await objection.transaction(this.profileService.transaction(trx), async _trx => {
            for (let index = 0; index < user.profiles.length; index++) {
                let profile = user.profiles[index];
                if (user.baseProfile && profile.id === user.baseProfile.id) {
                    profile = user.baseProfile;
                } else if (user.tenantProfile && profile.id === user.tenantProfile.id) {
                    profile = user.tenantProfile;
                }
                profile.paymentsStatus = status;
                await this.profileService.update(profile, _trx);
            }
        });

        // TODO: move to background task
        try {
            switch (status) {
                case dwolla.customer.CUSTOMER_STATUS.Retry:
                    await this.mailerService.sendCustomerVerificationRetry(user);
                    break;
                case dwolla.customer.CUSTOMER_STATUS.Document:
                    await this.mailerService.sendCustomerVerificationDocumentRequired(user);
                    break;
                case dwolla.customer.CUSTOMER_STATUS.Suspended:
                    await this.mailerService.sendCustomerSuspended(user);
                    break;
                case dwolla.customer.CUSTOMER_STATUS.Verified:
                    await this.mailerService.sendCustomerVerified(user);
                    break;
                default:
                    break;
            }
        } catch (e) {
            this.logger.error(e);
        }

        return user;
    }
}

@AutoWired
export class GetContractorTransactionsLogic extends Logic {
    @Inject private transactionService: TransactionService;

    async execute(contractorId: string, startDate, endDate: Date, status: string, page, limit: number): Promise<any> {
        const filter = builder => {
            Transaction.filter(builder, startDate, endDate, status, contractorId);
        };
        return await this.transactionService.listPaginated(page, limit, filter);
    }
}
