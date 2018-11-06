import {AddBeneficialOwnerRequest, EditBeneficialOwnerRequest} from './models';
import * as dwolla from '../dwolla/index';
import {AutoWired, Inject} from 'typescript-ioc';
import {BeneficialOwner} from '../dwolla/customer';
import {TenantService} from '../tenant/service';
import {Logic} from '../logic';

@AutoWired
export class AddBeneficialOwnerLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private tenantService: TenantService;

    async execute(request: AddBeneficialOwnerRequest, tenantId: string): Promise<BeneficialOwner> {
        this.tenantService.setRequestContext(this.context);
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
export class GetBeneficialOwnersLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private tenantService: TenantService;

    async execute(tenantId: string): Promise<Array<BeneficialOwner>> {
        this.tenantService.setRequestContext(this.context);
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new BeneficialOwnerError('Could not find tenant.');
        }

        await this.dwollaClient.authorize();
        return await this.dwollaClient.listBusinessVerifiedBeneficialOwners(tenant.dwollaUri);
    }
}

@AutoWired
export class GetBeneficialOwnerLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;

    async execute(id: string): Promise<BeneficialOwner> {
        await this.dwollaClient.authorize();
        return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(dwolla.Client.beneficialOwnerUri(id));
    }
}

@AutoWired
export class DeleteBeneficialOwnerLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;

    async execute(id: string): Promise<BeneficialOwner> {
        await this.dwollaClient.authorize();
        return await this.dwollaClient.deleteBusinessVerifiedBeneficialOwner(id);
    }
}

@AutoWired
export class EditBeneficialOwnerLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private tenantService: TenantService;

    async execute(request: EditBeneficialOwnerRequest): Promise<BeneficialOwner> {
        this.tenantService.setRequestContext(this.context);
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