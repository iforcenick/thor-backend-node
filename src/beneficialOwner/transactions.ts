import {
    AddBeneficialOwnerRequest,
    AddBeneficialOwnerResponse,
    BeneficialOwnerAddress,
    EditBeneficialOwnerRequest
} from './models';
import * as dwolla from '../dwolla/index';
import {AutoWired, Inject} from 'typescript-ioc';
import {BeneficialOwner} from '../dwolla/customer';
import {TenantContext} from '../context';
import {TenantService} from '../tenant/service';

@AutoWired
export class AddBeneficialOwnerTransaction {
    private dwollaClient: dwolla.Client;
    private tenantService: TenantService;

    constructor(@Inject dwollaClinet: dwolla.Client, @Inject tenantService: TenantService) {
        this.dwollaClient = dwollaClinet;
        this.tenantService = tenantService;
    }

    async execute(request: AddBeneficialOwnerRequest, tenantId: string): Promise<BeneficialOwner> {
        try {
            const tenant = await this.tenantService.get(tenantId);
            if (!tenant) {
                throw new BeneficialOwnerError('Could not find tenant.');
            }
            if (!tenant.dwollaUri) {
                throw new BeneficialOwnerError('Could not add beneficial owner for tenant, uri resource is invalid.');
            }

            const beneficialOwner = new BeneficialOwner(request);
            await this.dwollaClient.authorize();
            const response = await this.dwollaClient.createBusinessVerifiedBeneficialOwner(
                tenant.dwollaUri, beneficialOwner);
            return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(response);
        } catch (error) {
            throw error;
        }
    }
}

@AutoWired
export class GetBeneficialOwnerTransaction {
    private dwollaClient: dwolla.Client;
    private tenantService: TenantService;

    constructor(@Inject dwollaClinet: dwolla.Client, @Inject tenantService: TenantService) {
        this.dwollaClient = dwollaClinet;
        this.tenantService = tenantService;
    }

    async execute(tenantId: string): Promise<Array<BeneficialOwner>> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new BeneficialOwnerError('Could not find tenant.');
        }
        await this.dwollaClient.authorize();

        const beneficialOwners = await this.dwollaClient.listBusinessVerifiedBeneficialOwners(tenant.dwollaUri);

        return beneficialOwners;
    }
}

@AutoWired
export class EditBeneficialOwnerTransaction {
    private dwollaClient: dwolla.Client;
    private tenantService: TenantService;

    constructor(@Inject dwollaClinet: dwolla.Client, @Inject tenantService: TenantService) {
        this.dwollaClient = dwollaClinet;
        this.tenantService = tenantService;
    }

    async execute(request: EditBeneficialOwnerRequest): Promise<BeneficialOwner> {
        try {
            const beneficialOwner = new BeneficialOwner(request);
            await this.dwollaClient.authorize();
            const response = await this.dwollaClient.editBusinessVerifiedBeneficialOwner(
                request.id, beneficialOwner);
            return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(response);
        } catch (error) {
            throw error;
        }
    }
}

export class BeneficialOwnerError extends Error {
    constructor(message: string) {
        super(message);
    }
}