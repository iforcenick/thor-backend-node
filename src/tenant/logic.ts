import {Logic} from '../logic';
import * as generator from 'generate-password';
import {AutoWired, Inject} from 'typescript-ioc';
import {TenantService} from './service';
import {Errors} from 'typescript-rest';
import * as dwolla from '../dwolla';
import {Logger} from '../logger';
import {Tenant} from './models';
import {transaction} from 'objection';
import {User} from '../user/models';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {Profile} from '../profile/models';
import {RoleService} from '../user/role/service';
import {Role, Types} from '../user/role/models';
import * as objection from 'objection';
import {MailerService} from '../mailer';
import {Config} from '../config';
import {Settings} from './settings/models';

@AutoWired
export class GetTenantLogic extends Logic {
    @Inject private tenantService: TenantService;

    async execute(tenantId: string): Promise<any> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

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

        if (!tenant.dwollaUri) {
            throw new Errors.NotFoundError('Tenant company details not found');
        }

        return tenant.company;
    }
}

@AutoWired
export class GetTenantCompanyOwnerLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private dwollaClient: dwolla.Client;
    @Inject private logger: Logger;

    async execute(tenantId: string): Promise<any> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError();
        }

        try {
            const customer = await this.dwollaClient.getCustomer(tenant.dwollaUri);
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
    @Inject private dwollaClient: dwolla.Client;

    async execute(data: any, tenantId: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (tenant.dwollaUri) {
            throw new Errors.NotAcceptableError('Tenant company details already created');
        }

        try {
            const customer = dwolla.customer.factory(data);
            customer.type = dwolla.customer.TYPE.Business;
            tenant.dwollaUri = await this.dwollaClient.createCustomer(customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(tenant.dwollaUri);
            tenant.dwollaStatus = dwollaCustomer.status;
            tenant.dwollaType = dwollaCustomer.type;
            tenant.merge(data);

            await this.tenantService.update(tenant);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
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
    @Inject private dwollaClient: dwolla.Client;

    async execute(data: any, tenantId: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (!tenant.dwollaUri) {
            throw new Errors.NotFoundError('Tenant company details not found');
        }

        if (tenant.company.status != dwolla.customer.CUSTOMER_STATUS.Verified) {
            throw new Errors.NotAcceptableError('Tenant company cannot be edited, not in verified status');
        }

        try {
            const customer = dwolla.customer.factory(data);
            customer.type = tenant.dwollaType;
            await this.dwollaClient.updateCustomer(tenant.dwollaUri, customer.updateableFields());
            const dwollaCustomer = await this.dwollaClient.getCustomer(tenant.dwollaUri);
            tenant.dwollaStatus = dwollaCustomer.status;
            tenant.merge(data);

            await this.tenantService.update(tenant);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
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
    @Inject private dwollaClient: dwolla.Client;

    async execute(data: any, tenantId: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (!tenant.dwollaUri) {
            throw new Errors.NotFoundError('Tenant company details not found');
        }

        if (tenant.company.status != dwolla.customer.CUSTOMER_STATUS.Retry) {
            throw new Errors.NotAcceptableError('Tenant company cannot be retried, not in retry status');
        }

        try {
            const customer = dwolla.customer.factory(data);
            customer.type = tenant.dwollaType;
            await this.dwollaClient.updateCustomer(tenant.dwollaUri, customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(tenant.dwollaUri);
            tenant.dwollaStatus = dwollaCustomer.status;
            tenant.merge(data);

            await this.tenantService.update(tenant);
        } catch (err) {
            if (err instanceof dwolla.DwollaRequestError) {
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
    @Inject private dwollaClient: dwolla.Client;

    async execute(tenantId: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (tenant.company.status != dwolla.customer.CUSTOMER_STATUS.Document) {
            throw new Errors.NotAcceptableError('Tenant has no pending documents');
        }

        return await this.dwollaClient.listDocuments(tenant.dwollaUri);
    }
}

@AutoWired
export class AddTenantCompanyDocumentsLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private dwollaClient: dwolla.Client;

    async execute(tenantId: string, file: any, type: string): Promise<any> {
        const tenant: Tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (tenant.company.status != dwolla.customer.CUSTOMER_STATUS.Document) {
            throw new Errors.NotAcceptableError('No additional documents required');
        }

        const location = await this.dwollaClient.createDocument(tenant.dwollaUri, file.buffer, file.originalname, type);
        return await this.dwollaClient.getDocument(location);
    }
}

@AutoWired
export class AddTenantLogic extends Logic {
    @Inject tenantService: TenantService;
    @Inject userService: UserService;
    @Inject profileService: ProfileService;
    @Inject roleService: RoleService;
    @Inject mailerService: MailerService;
    @Inject logger: Logger;
    @Inject config: Config;

    async execute(name: string, email: string, settings: any): Promise<Tenant> {
        const tenantEntity: Tenant = await this.tenantService.getOneBy('name', name);
        if (tenantEntity) {
            throw new Error(`Name ${name} for tenant already used`);
        }

        let user: User;
        const adminRole: Role = await this.roleService.find(Types.admin);
        const tenant = await transaction(this.tenantService.transaction(), async trx => {
            const tenant = await this.addTenantEntity(name, settings, trx);
            user = await this.addAdminUser(trx);
            const profile = await this.addAdminUserProfile(user.id, tenant.id, name, email, trx);
            await this.addRoleForAdminProfile(profile, adminRole, trx);

            return tenant;
        });

        try {
            const link = `${this.config.get('application.frontUri')}/reset-password/${user.passwordResetToken}`;
            await this.mailerService.sendTenantConfirmAccount(email, name, link);
        } catch (error) {
            console.log(error);
            this.logger.error(error.message);
        }

        return await this.tenantService.get(tenant.id);
    }

    private async addTenantEntity(name: string, settings: Settings, trx: objection.Transaction): Promise<Tenant> {
        const tenant: Tenant = Tenant.factory({name, settings: new Settings(settings)});
        return await this.tenantService.insert(tenant, trx);
    }

    private async addAdminUser(trx: objection.Transaction): Promise<User> {
        const user: User = User.factory({});
        user.password = generator.generate({length: 20, numbers: true, uppercase: true});
        user.passwordResetToken = await this.userService.getPasswordResetToken();
        user.passwordResetExpiry = Date.now() + 604800000; // 7 days
        return await this.userService.insert(user, trx);
    }

    private async addAdminUserProfile(
        adminUserId: string,
        tenantId: string,
        tenantName: string,
        email: string,
        trx: objection.Transaction,
    ) {
        const profile: Profile = Profile.factory({});
        profile.tenantId = tenantId;
        profile.userId = adminUserId;

        profile.firstName = `admin_${tenantName}`;
        profile.lastName = `admin_${tenantName}`;

        profile.email = email;
        profile.phone = '0123456789';

        return await this.profileService.insert(profile, trx);
    }

    private async addRoleForAdminProfile(profile: Profile, adminRole: Role, trx: objection.Transaction) {
        await this.profileService.setRoleForProfile(profile, adminRole.id, trx);
    }
}
