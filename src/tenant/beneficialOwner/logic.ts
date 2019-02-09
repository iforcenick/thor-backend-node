import {AutoWired, Inject} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import {BeneficialOwner} from '../../dwolla/customer';
import * as dwolla from '../../dwolla';
import {Logic} from '../../logic';
import * as models from './models';
import {TenantService} from '../../tenant/service';

@AutoWired
export class AddBeneficialOwnerLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private tenantService: TenantService;

    async execute(request: models.AddBeneficialOwnerRequest, tenantId: string): Promise<BeneficialOwner> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }
        if (!tenant.paymentsUri) {
            throw new Errors.ConflictError('Could not add beneficial owner for tenant, no tenant company');
        }
        if (tenant.businessType == dwolla.customer.BUSINESS_TYPE.Sole) {
            throw new Errors.ConflictError('soleProprietorship company cannot have beneficial owners');
        }

        const beneficialOwner = new BeneficialOwner(request);
        const response = await this.dwollaClient.createBusinessVerifiedBeneficialOwner(
            tenant.paymentsUri,
            beneficialOwner,
        );
        return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(response);
    }
}

@AutoWired
export class GetBeneficialOwnersLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private tenantService: TenantService;

    async execute(tenantId: string): Promise<Array<BeneficialOwner>> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new BeneficialOwnerError('Could not find tenant.');
        }

        return await this.dwollaClient.listBusinessVerifiedBeneficialOwners(tenant.paymentsUri);
    }
}

@AutoWired
export class GetBeneficialOwnerLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;

    async execute(id: string): Promise<BeneficialOwner> {
        return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(dwolla.Client.beneficialOwnerUri(id));
    }
}

@AutoWired
export class DeleteBeneficialOwnerLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;

    async execute(id: string): Promise<BeneficialOwner> {
        return await this.dwollaClient.deleteBusinessVerifiedBeneficialOwner(id);
    }
}

@AutoWired
export class EditBeneficialOwnerLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;

    async execute(request: models.EditBeneficialOwnerRequest): Promise<BeneficialOwner> {
        const beneficialOwner = new BeneficialOwner(request);
        const response = await this.dwollaClient.editBusinessVerifiedBeneficialOwner(request.id, beneficialOwner);
        return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(response);
    }
}

@AutoWired
export class AddBeneficialOwnerRetryLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private dwollaClient: dwolla.Client;

    async execute(request: models.RetryBeneficialOwnerRequest, tenantId: string): Promise<any> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }
        if (!tenant.paymentsUri) {
            throw new Errors.ConflictError('Could not add beneficial owner for tenant, no tenant company');
        }
        if (tenant.businessType == dwolla.customer.BUSINESS_TYPE.Sole) {
            throw new Errors.ConflictError('Sole proprietorship companies cannot have beneficial owners');
        }
        const beneficialOwner = new BeneficialOwner(request);
        const response = await this.dwollaClient.retryBusinessVerifiedBeneficialOwner(request.id, beneficialOwner);
        return await this.dwollaClient.getBusinessVerifiedBeneficialOwner(response);
    }
}

export class BeneficialOwnerError extends Error {
    constructor(message: string) {
        super(message);
    }
}
