import {Logic} from '../logic';
import {AutoWired, Inject} from 'typescript-ioc';
import {Status} from '../invitation/models';
import * as dwolla from '../dwolla';
import {User} from '../user/models';
import * as models from '../profile/models';
import {Profile} from '../profile/models';
import {UserService} from '../user/service';
import {DwollaNotifier} from '../dwolla/notifier';
import {InvitationService} from '../invitation/service';
import * as role from '../user/role';
import {RoleService} from '../user/role/service';
import {RequestContext} from '../context';
import * as _ from 'lodash';
import {transaction} from 'objection';
import {ProfileService} from '../profile/service';
import {Errors} from 'typescript-rest';
import {Logger} from '../logger';
import * as generator from 'generate-password';

@AutoWired
export class AddContractorLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private dwollaNotifier: DwollaNotifier;
    @Inject private userService: UserService;
    @Inject private invitationService: InvitationService;
    @Inject private roleService: RoleService;
    @Inject private profileService: ProfileService;
    @Inject private logger: Logger;

    constructor(context: RequestContext) {
        super(context);
        this.userService.setRequestContext(context);
        this.invitationService.setRequestContext(context);
        this.roleService.setRequestContext(context);
        this.profileService.setRequestContext(context);
    }

    async execute(profileData: any, tenantId, password: string, trx?: any) {
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
            const contractorRole = await this.getRole(role.models.Types.contractor);
            const roles = [contractorRole];

            await this.createBaseProfile(profile, roles, _trx);
            await this.createTenantProfile(profile, roles, tenantId, _trx);
            user = await this.userService.get(user.id, _trx);
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
    }

    private async createBaseProfile(profile: Profile, roles: Array<role.models.Role>, trx: transaction<any>) {
        let baseProfile = _.clone(profile);
        baseProfile.dwollaUri = undefined;
        baseProfile.dwollaStatus = undefined;
        baseProfile.dwollaSourceUri = undefined;
        baseProfile = await this.profileService.insert(baseProfile, trx);
        await this.addRoles(baseProfile, roles, trx);
    }

    private async addRoles(profile: Profile, roles: Array<role.models.Role>, trx: transaction<any>) {
        for (const role of roles) {
            await profile.$relatedQuery(models.Relations.roles, trx).relate(role.id);
        }
    }

    async getRole(role: role.models.Types): Promise<role.models.Role> {
        return await this.roleService.find(role);
    }
}

export class AddContractorOnRetryStatusLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private dwollaNotifier: DwollaNotifier;
    @Inject private userService: UserService;
    @Inject private logger: Logger;
    @Inject private profileService: ProfileService;

    constructor(context: RequestContext) {
        super(context);
        this.profileService.setRequestContext(context);
        this.userService.setRequestContext(context);
    }

    async execute(profileData: any, tenantId, userId: string) {
        this.userService.setTenantId(tenantId);
        const user = await this.userService.get(userId);
        await this.dwollaClient.authorize();
        const customer = dwolla.customer.factory(profileData);
        customer.type = dwolla.customer.TYPE.Personal;
        const updateableFields = customer.updateableFields();
        await this.dwollaClient.updateCustomer(user.tenantProfile.dwollaUri, updateableFields);

        const dwollaCustomer = await this.dwollaClient.getCustomer(user.tenantProfile.dwollaUri);

        user.tenantProfile.dwollaStatus = dwollaCustomer.status;
        user.tenantProfile.dwollaType = dwollaCustomer.type;

        user.tenantProfile.merge(profileData);

        console.log(user.tenantProfile);

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

    constructor(context: RequestContext) {
        super(context);
        this.invitationService.setRequestContext(context);
    }

    async execute(profileData: any, invitationToken, password: string) {
        const invitation = await this.invitationService.getForAllTenants(invitationToken);
        const tenantId = invitation.tenantId;
        let user = null;

        if (!invitation.isPending()) {
            throw new Errors.NotAcceptableError('Invitation already used');
        }

        if (invitation.email != profileData.email) {
            throw new Errors.BadRequestError('Contractor and invitation emails do not match.');
        }

        await transaction(this.invitationService.transaction(), async trx => {
            const logic = new AddContractorLogic(this.context);
            user = await logic.execute(profileData, tenantId, password, trx);

            invitation.status = Status.used;
            await this.invitationService.update(invitation, trx);
        });

        return user;
    }
}