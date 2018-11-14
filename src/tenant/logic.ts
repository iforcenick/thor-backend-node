import {Logic} from '../logic';
import {AutoWired, Inject} from 'typescript-ioc';
import {TenantService} from './service';
import {Errors} from 'typescript-rest';
import * as dwolla from '../dwolla';
import {Logger} from '../logger';
import {Tenant} from './models';

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
            this.logger.error(e.message);
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