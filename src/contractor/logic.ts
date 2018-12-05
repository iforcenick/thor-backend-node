import {Logic} from '../logic';
import {AutoWired, Inject} from 'typescript-ioc';
import {Status} from '../invitation/models';
import * as dwolla from '../dwolla';
import {User} from '../user/models';
import * as models from '../profile/models';
import {Profile} from '../profile/models';
import {UserService} from '../user/service';
import {InvitationService} from '../invitation/service';
import * as role from '../user/role';
import {RoleService} from '../user/role/service';
import * as _ from 'lodash';
import * as objection from 'objection';
import {ProfileService} from '../profile/service';
import {Errors} from 'typescript-rest';
import {Logger} from '../logger';
import * as generator from 'generate-password';
import {MailerService} from '../mailer';
import {IEvent} from '../dwolla/event';
import {GenerateJwtLogic} from '../auth/logic';

@AutoWired
export class AddContractorLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private userService: UserService;
    @Inject private roleService: RoleService;
    @Inject private profileService: ProfileService;
    @Inject protected mailerService: MailerService;
    @Inject protected logger: Logger;

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

        await objection.transaction(trx, async _trx => {
            user = await this.userService.insert(user, _trx);
            profile.userId = user.id;
            // TODO: should the external id and roles only be stored in the tenant profile?
            profile.externalId = externalId;
            const contractorRole = await this.getRole(role.models.Types.contractor);
            const roles = [contractorRole];

            await this.createBaseProfile(profile, roles, _trx);
            user.tenantProfile = await this.createTenantProfile(profile, roles, tenantId, _trx);
        });

        // TODO: move to background task
        try {
            switch (profile.dwollaStatus) {
                // TODO: test if dwolla immediately verifies customers... that may be only a sandbox thing
                case dwolla.customer.CUSTOMER_STATUS.Verified:
                    await this.mailerService.sendCustomerCreatedAndVerified(user);
                    break;
                // TODO: I think this is the only case needed during prod
                case dwolla.customer.CUSTOMER_STATUS.Unverified:
                    await this.mailerService.sendCustomerCreated(user);
                    break;
                default:
                    await sendCustomerStatusEmail(user, profile.dwollaStatus);
                    break;
            }
        } catch (e) {
            this.logger.error(e.message);
        }

        return user;
    }

    private async createTenantProfile(
        profile: Profile,
        roles: Array<role.models.Role>,
        tenantId: string,
        trx: objection.Transaction,
    ) {
        profile.tenantId = tenantId;
        profile = await this.profileService.insert(profile, trx);
        await this.addRoles(profile, roles, trx);
        return profile;
    }

    private async createBaseProfile(profile: Profile, roles: Array<role.models.Role>, trx: objection.Transaction) {
        let baseProfile = _.clone(profile);
        baseProfile.dwollaUri = undefined;
        baseProfile.dwollaStatus = undefined;
        baseProfile.dwollaSourceUri = undefined;
        baseProfile = await this.profileService.insert(baseProfile, trx, false);
        await this.addRoles(baseProfile, roles, trx);
        return baseProfile;
    }

    private async addRoles(profile: Profile, roles: Array<role.models.Role>, trx: objection.Transaction) {
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
    @Inject private userService: UserService;
    @Inject private profileService: ProfileService;
    @Inject protected logger: Logger;

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

        // TODO: move to background task
        try {
            await sendCustomerStatusEmail(user, user.tenantProfile.dwollaStatus);
        } catch (e) {
            this.logger.error(e.message);
        }

        return user;
    }
}

@AutoWired
export class AddInvitedContractorLogic extends Logic {
    @Inject private invitationService: InvitationService;

    async execute(profileData: any, invitationToken, password: string) {
        const invitation = await this.invitationService.getForAllTenants(invitationToken);
        if (!invitation) {
            throw new Errors.NotFoundError('Invitation not found');
        }

        const tenantId = invitation.tenantId;
        let user;

        if (!invitation.isPending()) {
            throw new Errors.NotAcceptableError('Invitation already used');
        }

        if (invitation.email != profileData.email) {
            throw new Errors.ConflictError('Contractor and invitation emails do not match.');
        }

        await objection.transaction(this.invitationService.transaction(), async trx => {
            const logic = new AddContractorLogic(this.context);
            user = await logic.execute(profileData, tenantId, password, invitation.externalId, trx);

            invitation.status = Status.used;
            await this.invitationService.update(invitation, trx);
        });

        user.token = await new GenerateJwtLogic().execute(user);

        return user;
    }
}

@AutoWired
export class UpdateContractorStatusLogic extends Logic {
    @Inject private profileService: ProfileService;
    @Inject protected mailerService: MailerService;
    @Inject protected logger: Logger;

    async execute(user: User, status: string): Promise<any> {
        // only send an email for a changed status
        if (user.tenantProfile.dwollaStatus === status) return;

        user.tenantProfile.dwollaStatus = status;
        await this.profileService.update(user.tenantProfile);

        try {
            sendCustomerStatusEmail(user, status);
        } catch (e) {
            this.logger.error(e);
        }
    }
}

async function sendCustomerStatusEmail(user: User, status: string): Promise<any> {
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
}
