import {Logic} from '../logic';
import {AutoWired, Inject} from 'typescript-ioc';
import {Invitation, Status} from '../invitation/models';
import * as dwolla from '../dwolla';
import {User} from '../user/models';
import * as models from '../profile/models';
import {Profile} from '../profile/models';
import {UserService} from '../user/service';
import {DwollaNotifier} from '../dwolla/notifier';
import {InvitationService} from '../invitation/service';
import * as role from '../user/role';
import {RoleService} from '../user/role/service';
import * as _ from 'lodash';
import {transaction} from 'objection';
import {ProfileService} from '../profile/service';
import {Errors} from 'typescript-rest';
import {Logger} from '../logger';
import * as generator from 'generate-password';
import {MailerService} from '../mailer';
import {IEvent} from '../dwolla/event';
import {RequestContext} from '../context';

@AutoWired
export class AddContractorLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private dwollaNotifier: DwollaNotifier;
    @Inject private userService: UserService;
    @Inject private invitationService: InvitationService;
    @Inject private roleService: RoleService;
    @Inject private profileService: ProfileService;
    @Inject private logger: Logger;

    async execute(profileData: any, tenantId, password: string, externalId?: string, trx?: any) {
        this.userService.setTenantId(tenantId);
        if (!trx) {
            trx = this.userService.transaction();
        }

        let user: User = User.factory({});
        const profile = Profile.factory(profileData);
        const customer = dwolla.customer.factory(profileData);
        customer.type = dwolla.customer.TYPE.Personal;
        profile.dwollaUri = await this.dwollaClient.createCustomer(customer);
        const dwollaCustomer = await this.dwollaClient.getCustomer(profile.dwollaUri);
        profile.dwollaStatus = dwollaCustomer.status;
        profile.dwollaType = dwollaCustomer.type;

        if (!password) {
            password = generator.generate({length: 20, numbers: true, uppercase: true});
        }

        user.password = await this.userService.hashPassword(password);

        await transaction(trx, async _trx => {
            user = await this.userService.insert(user, _trx);
            profile.userId = user.id;
            profile.externalId = externalId;
            const contractorRole = await this.getRole(role.models.Types.contractor);
            const roles = [contractorRole];

            user.tenantProfile = await this.createTenantProfile(profile, roles, tenantId, _trx);
        });

        try {
            await this.dwollaNotifier.sendNotificationForDwollaCustomer(user, dwollaCustomer.status);
        } catch (e) {
            this.logger.error(e.message);
        }

        return user;
    }

    private async createTenantProfile(profile: Profile, roles: Array<role.models.Role>, tenantId: string, trx: transaction<any>) {
        profile.tenantId = tenantId;
        profile = await this.profileService.insert(profile, trx);
        await this.addRoles(profile, roles, trx);
        return profile;
    }

    private async createBaseProfile(profile: Profile, roles: Array<role.models.Role>, trx: transaction<any>) {
        let baseProfile = _.clone(profile);
        baseProfile.dwollaUri = undefined;
        baseProfile.dwollaStatus = undefined;
        baseProfile.dwollaSourceUri = undefined;
        baseProfile = await this.profileService.insert(baseProfile, trx);
        await this.addRoles(baseProfile, roles, trx);
        return baseProfile;
    }

    private async addRoles(profile: Profile, roles: Array<role.models.Role>, trx: transaction<any>) {
        profile.roles = [];
        for (const role of roles) {
            await profile.$relatedQuery(models.Relations.roles, trx).relate(role.id);
            profile.roles.push(role);
        }
    }

    async getRole(role: role.models.Types): Promise<role.models.Role> {
        return await this.roleService.find(role);
    }
}

@AutoWired
export class AddContractorOnRetryStatusLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private dwollaNotifier: DwollaNotifier;
    @Inject private userService: UserService;
    @Inject private logger: Logger;
    @Inject private profileService: ProfileService;

    async execute(profileData: any, tenantId, userId: string) {
        this.userService.setTenantId(tenantId);
        const user = await this.userService.get(userId);
        const customer = dwolla.customer.factory(profileData);
        customer.type = dwolla.customer.TYPE.Personal;
        const updateableFields = customer.updateableFields();
        await this.dwollaClient.updateCustomer(user.tenantProfile.dwollaUri, updateableFields);

        const dwollaCustomer = await this.dwollaClient.getCustomer(user.tenantProfile.dwollaUri);

        user.tenantProfile.dwollaStatus = dwollaCustomer.status;
        user.tenantProfile.dwollaType = dwollaCustomer.type;
        user.tenantProfile.merge(profileData);

        await this.profileService.update(user.tenantProfile);

        try {
            await this.dwollaNotifier.sendNotificationForDwollaCustomer(user, dwollaCustomer.status);
        } catch (e) {
            this.logger.error(e.message);
        }

        return user;
    }
}


@AutoWired
export class AddInvitedContractorLogic extends Logic {
    @Inject private invitationService: InvitationService;
    @Inject private userService: UserService;

    async execute(profileData: any, invitationToken, password: string) {
        const invitation = await this.invitationService.getForAllTenants(invitationToken);
        if (!invitation) {
            throw new Errors.NotFoundError('Invitation not found');
        }

        const tenantId = invitation.tenantId;
        let user: User;

        if (!invitation.isPending()) {
            throw new Errors.NotAcceptableError('Invitation already used');
        }

        if (invitation.email != profileData.email) {
            throw new Errors.ConflictError('Contractor and invitation emails do not match.');
        }

        await transaction(this.invitationService.transaction(), async trx => {
            const logic = new AddContractorLogic(this.context);
            user = await logic.execute(profileData, tenantId, password, invitation.externalId, trx);

            invitation.status = Status.used;
            await this.invitationService.update(invitation, trx);
        });

        return user;
    }
}

@AutoWired
export class ContractorDocumentEventLogic extends Logic {
    @Inject private mailer: MailerService;
    @Inject userService: UserService;
    @Inject profileService: ProfileService;
    @Inject logger: Logger;

    async execute(event: IEvent): Promise<any> {
        const profile = await this.profileService.getByResourceLink(event['_links']['resource']['href']);
        if (!profile) {
            throw new Error(`Could not find profile by dwollaUri ${event['_links']['resource']['href']}`);
        }
        const user = await this.userService.get(profile.userId);

        if (!user) {
            throw new Error(`Could not find user by profile ${profile.id}`);
        }

        user.tenantProfile.dwollaStatus = dwolla.customer.CUSTOMER_STATUS.Document;
        try {
            await this.mailer.sendCustomerDocumentRequired(user, user);
        } catch (error) {
            this.logger.error(error);
        }
        await this.profileService.update(user.tenantProfile);
    }
}
