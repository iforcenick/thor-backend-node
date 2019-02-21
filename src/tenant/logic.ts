import * as generator from 'generate-password';
import {transaction} from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import {Config} from '../config';
import {DwollaRequestError} from '../payment/dwolla';
import {Logger} from '../logger';
import {Logic} from '../logic';
import {MailerService} from '../mailer';
import {Tenant, Statuses} from './models';
import {User} from '../user/models';
import * as profiles from '../profile/models';
import {Role, Types} from '../user/role/models';
import {Settings} from './settings/models';
import * as invitations from '../invitation/models';
import * as payments from '../payment';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {TenantService} from './service';
import {RoleService} from '../user/role/service';
import {InvitationService} from '../invitation/service';

@AutoWired
export class GetTenantLogic extends Logic {
    @Inject private tenantService: TenantService;

    async execute(tenantId: string): Promise<any> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }
        tenant.settings = new Settings(tenant.settings);
        return tenant;
    }
}

@AutoWired
export class GetTenantCompanyLogic extends Logic {
    @Inject private tenantService: TenantService;

    async execute(tenantId: string): Promise<any> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        if (!tenant.paymentsUri) {
            throw new Errors.NotFoundError('Tenant company details not found');
        }

        return tenant.company;
    }
}

@AutoWired
export class GetTenantCompanyOwnerLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private paymentClient: payments.PaymentClient;
    @Inject private logger: Logger;

    async execute(tenantId: string): Promise<any> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        try {
            const customer = await this.paymentClient.getCustomer(tenant.paymentsUri);
            return customer.controller;
        } catch (e) {
            this.logger.error(e);
            throw new Errors.NotFoundError('Owner data not found');
        }
    }
}

@AutoWired
export class AddTenantCompanyLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(data: any, tenantId: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (tenant.paymentsUri) {
            throw new Errors.NotAcceptableError('Tenant company details already created');
        }

        try {
            const customer = payments.customers.factory(data);
            customer.type = payments.customers.TYPE.Business;
            tenant.paymentsUri = await this.paymentClient.createCustomer(customer);
            const dwollaCustomer = await this.paymentClient.getCustomer(tenant.paymentsUri);
            tenant.paymentsStatus = dwollaCustomer.status;
            tenant.paymentsType = dwollaCustomer.type;
            tenant.status = Statuses.bank;
            tenant.merge(data);

            await this.tenantService.update(tenant);
        } catch (err) {
            if (err instanceof DwollaRequestError) {
                throw err.toValidationError();
            }
            throw new Errors.InternalServerError(err.message);
        }

        return tenant.company;
    }
}

@AutoWired
export class UpdateTenantCompanyLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(data: any, tenantId: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (!tenant.paymentsUri) {
            throw new Errors.NotFoundError('Tenant company details not found');
        }

        if (tenant.company.status != payments.customers.CUSTOMER_STATUS.Verified) {
            throw new Errors.NotAcceptableError('Tenant company cannot be edited, not in verified status');
        }

        try {
            const customer = payments.customers.factory(data);
            customer.type = tenant.paymentsType;
            await this.paymentClient.updateCustomer(tenant.paymentsUri, customer.updateableFields());
            const dwollaCustomer = await this.paymentClient.getCustomer(tenant.paymentsUri);
            tenant.paymentsStatus = dwollaCustomer.status;
            tenant.merge(data);

            await this.tenantService.update(tenant);
        } catch (err) {
            if (err instanceof DwollaRequestError) {
                throw err.toValidationError();
            }
            throw new Errors.InternalServerError(err.message);
        }

        return tenant.company;
    }
}

@AutoWired
export class RetryTenantCompanyLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(data: any, tenantId: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (!tenant.paymentsUri) {
            throw new Errors.NotFoundError('Tenant company details not found');
        }

        if (tenant.company.status != payments.customers.CUSTOMER_STATUS.Retry) {
            throw new Errors.NotAcceptableError('Tenant company cannot be retried, not in retry status');
        }

        try {
            const customer = payments.customers.factory(data);
            customer.type = tenant.paymentsType;
            await this.paymentClient.updateCustomer(tenant.paymentsUri, customer);
            const dwollaCustomer = await this.paymentClient.getCustomer(tenant.paymentsUri);
            tenant.paymentsStatus = dwollaCustomer.status;
            tenant.merge(data);

            await this.tenantService.update(tenant);
        } catch (err) {
            if (err instanceof DwollaRequestError) {
                throw err.toValidationError();
            }
            throw new Errors.InternalServerError(err.message);
        }

        return tenant.company;
    }
}

@AutoWired
export class ListTenantCompanyDocumentsLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(tenantId: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (tenant.company.status != payments.customers.CUSTOMER_STATUS.Document) {
            throw new Errors.NotAcceptableError('Tenant has no pending documents');
        }

        return await this.paymentClient.listDocuments(tenant.paymentsUri);
    }
}

@AutoWired
export class AddTenantCompanyDocumentsLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(tenantId: string, file: any, type: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (tenant.company.status != payments.customers.CUSTOMER_STATUS.Document) {
            throw new Errors.NotAcceptableError('No additional documents required');
        }

        const location = await this.paymentClient.createDocument(
            tenant.paymentsUri,
            file.buffer,
            file.originalname,
            type,
        );
        return await this.paymentClient.getDocument(location);
    }
}

@AutoWired
export class AddTenantLogic extends Logic {
    @Inject tenantService: TenantService;
    @Inject userService: UserService;
    @Inject profileService: ProfileService;
    @Inject roleService: RoleService;
    @Inject mailerService: MailerService;
    @Inject invitationService: InvitationService;
    @Inject logger: Logger;
    @Inject config: Config;

    async execute(name: string, email: string, settings: any): Promise<Tenant> {
        const tenantEntity: Tenant = await this.tenantService.getOneBy('name', name);
        if (tenantEntity) {
            throw new Error(`A company named, ${name}, already exists`);
        }

        let user: User;
        let tenantProfile: profiles.Profile;
        const tenant = await transaction(this.tenantService.transaction(), async trx => {
            // create the tenant
            let tenant: Tenant = Tenant.factory({name, status: Statuses.company, settings: new Settings(settings)});
            tenant = await this.tenantService.insert(tenant, trx);

            // TODO: link the accounts if the email is already associated with an account
            user = User.factory({});
            const password = generator.generate({length: 20, numbers: true, uppercase: true});
            user.password = await user.hashPassword(password);
            user = await this.userService.insert(user, trx);

            // create the tenant profile
            tenantProfile = profiles.Profile.factory({email, firstName: email});
            tenantProfile.status = profiles.Statuses.invited;
            tenantProfile.userId = user.id;
            tenantProfile.tenantId = tenant.id;
            tenantProfile = await this.profileService.insert(tenantProfile, trx);

            // add an admin role to the profile
            tenantProfile.roles = [];
            const adminRole: Role = await this.roleService.find(Types.admin);
            await tenantProfile.$relatedQuery(profiles.Relations.roles, trx).relate(adminRole.id);
            tenantProfile.roles.push(adminRole);

            return tenant;
        });

        let invitation = invitations.Invitation.factory({
            userId: user.id,
            tenantId: tenant.id,
            email,
            type: invitations.Types.admin,
            status: invitations.Status.pending,
        });
        invitation = await this.invitationService.insert(invitation);

        try {
            const link = `${this.config.get('application.frontUri')}/register/${invitation.id}`;
            await this.mailerService.sendTenantConfirmAccount(email, name, link);
        } catch (error) {
            this.logger.error(error.message);
        }

        return await this.tenantService.get(tenant.id);
    }
}
