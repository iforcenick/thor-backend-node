import {Logic} from '../logic';
import {AutoWired, Inject} from 'typescript-ioc';
import {Status} from '../invitation/models';
import * as dwolla from '../dwolla';
import {Errors} from 'typescript-rest';
import * as usersModels from '../user/models';
import {Profile} from '../profile/models';
import {UserService} from '../user/service';
import {DwollaNotifier} from '../dwolla/notifier';
import {InvitationService} from '../invitation/service';

@AutoWired
export class AddContractorLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private dwollaNotifier: DwollaNotifier;
    @Inject private service: UserService;
    @Inject private invitationService: InvitationService;

    async execute(profileData: any, tenant, invitationToken, password: string) {
        this.service.setRequestContext(this.context);
        this.invitationService.setRequestContext(this.context);

        let user: usersModels.User = usersModels.User.factory({});
        const profile = Profile.factory(profileData);
        await this.dwollaClient.authorize();
        const customer = dwolla.customer.factory(profileData);
        customer.type = dwolla.customer.TYPE.Personal;
        profile.dwollaUri = await this.dwollaClient.createCustomer(customer);
        const dwollaCustomer = await this.dwollaClient.getCustomer(profile.dwollaUri);
        profile.dwollaStatus = dwollaCustomer.status;
        profile.dwollaType = dwollaCustomer.type;

        this.service.setTenantId(tenant);
        user.password = await this.service.hashPassword(password);
        user = await this.service.createWithProfile(user, profile, tenant);
        user = await this.service.get(user.id);
        await this.dwollaNotifier.sendNotificationForDwollaCustomer(user, dwollaCustomer.status);

        const invitation = await this.invitationService.getForAllTenants(invitationToken);

        if (invitation.email != profileData.email) {
            throw new Errors.BadRequestError('Contractor and invitation emails do not match.');
        }

        invitation.status = Status.used;
        await this.invitationService.update(invitation);

        return user;
    }
}