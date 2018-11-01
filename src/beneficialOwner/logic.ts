import {AddBeneficialOwnerRequest, EditBeneficialOwnerRequest} from './models';
import * as dwolla from '../dwolla/index';
import {AutoWired, Inject} from 'typescript-ioc';
import {BeneficialOwner} from '../dwolla/customer';
import {TenantService} from '../tenant/service';
import {Client} from "../dwolla/client";

@AutoWired
export class AddBeneficialOwnerLogic {
    private dwollaClient: dwolla.Client;
    private tenantService: TenantService;

    constructor(@Inject dwollaClient: dwolla.Client, @Inject tenantService: TenantService) {
        this.dwollaClient = dwollaClient;
        this.tenantService = tenantService;
    }

    async execute(request: AddBeneficialOwnerRequest, tenantId: string): Promise<BeneficialOwner> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new BeneficialOwnerError('Could not find tenant.');
        }
        if (!tenant.dwollaUri) {
            throw new BeneficialOwnerError('Could not add beneficial owner for tenant, uri resource is invalid.');
        }

        const beneficialOwner = new BeneficialOwner(request);
        await this.dwollaClient.authorize();
        const response = await this.dwollaClient.createBusinessVerifiedBeneficialOwner(tenant.dwollaUri, beneficialOwner);
        return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(response);
    }
}

@AutoWired
export class GetBeneficialOwnersLogic {
    private dwollaClient: dwolla.Client;
    private tenantService: TenantService;

    constructor(@Inject dwollaClient: dwolla.Client, @Inject tenantService: TenantService) {
        this.dwollaClient = dwollaClient;
        this.tenantService = tenantService;
    }

    async execute(tenantId: string): Promise<Array<BeneficialOwner>> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new BeneficialOwnerError('Could not find tenant.');
        }

        await this.dwollaClient.authorize();
        return await this.dwollaClient.listBusinessVerifiedBeneficialOwners(tenant.dwollaUri);
    }
}

@AutoWired
export class GetBeneficialOwnerLogic {
    private dwollaClient: dwolla.Client;

    constructor(@Inject dwollaClient: dwolla.Client) {
        this.dwollaClient = dwollaClient;
    }

    async execute(id: string): Promise<BeneficialOwner> {
        await this.dwollaClient.authorize();
        return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(dwolla.Client.beneficialOwnerUri(id));
    }
}

@AutoWired
export class EditBeneficialOwnerLogic {
    private dwollaClient: dwolla.Client;
    private tenantService: TenantService;

    constructor(@Inject dwollaClient: dwolla.Client, @Inject tenantService: TenantService) {
        this.dwollaClient = dwollaClient;
        this.tenantService = tenantService;
    }

    async execute(request: EditBeneficialOwnerRequest): Promise<BeneficialOwner> {
        const beneficialOwner = new BeneficialOwner(request);
        await this.dwollaClient.authorize();
        const response = await this.dwollaClient.editBusinessVerifiedBeneficialOwner(request.id, beneficialOwner);
        return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(response);
    }
}

export class BeneficialOwnerError extends Error {
    constructor(message: string) {
        super(message);
    }
}