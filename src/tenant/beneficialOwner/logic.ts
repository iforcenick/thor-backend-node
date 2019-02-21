import {AutoWired, Inject} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import {BeneficialOwner} from '../../payment/customer';
import {Logic} from '../../logic';
import * as models from './models';
import * as payments from '../../payment';
import {TenantService} from '../../tenant/service';

@AutoWired
export class AddBeneficialOwnerLogic extends Logic {
    @Inject private paymentClient: payments.PaymentClient;
    @Inject private tenantService: TenantService;

    async execute(request: models.AddBeneficialOwnerRequest, tenantId: string): Promise<BeneficialOwner> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }
        if (!tenant.paymentsUri) {
            throw new Errors.ConflictError('Could not add beneficial owner for tenant, no tenant company');
        }
        if (tenant.businessType == payments.customers.BUSINESS_TYPE.Sole) {
            throw new Errors.ConflictError('soleProprietorship company cannot have beneficial owners');
        }

        const beneficialOwner = new BeneficialOwner(request);
        const response = await this.paymentClient.createBusinessVerifiedBeneficialOwner(
            tenant.paymentsUri,
            beneficialOwner,
        );
        return await this.paymentClient.getBusinessVerifiedBeneficialOwner(response);
    }
}

@AutoWired
export class GetBeneficialOwnersLogic extends Logic {
    @Inject private paymentClient: payments.PaymentClient;
    @Inject private tenantService: TenantService;

    async execute(tenantId: string): Promise<Array<BeneficialOwner>> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new BeneficialOwnerError('Could not find tenant.');
        }

        return await this.paymentClient.listBusinessVerifiedBeneficialOwners(tenant.paymentsUri);
    }
}

@AutoWired
export class GetBeneficialOwnerLogic extends Logic {
    @Inject private paymentClient: payments.PaymentClient;

    async execute(id: string): Promise<BeneficialOwner> {
        return await this.paymentClient.getBusinessVerifiedBeneficialOwner(payments.PaymentClient.beneficialOwnerUri(id));
    }
}

@AutoWired
export class DeleteBeneficialOwnerLogic extends Logic {
    @Inject private paymentClient: payments.PaymentClient;

    async execute(id: string): Promise<BeneficialOwner> {
        return await this.paymentClient.deleteBusinessVerifiedBeneficialOwner(id);
    }
}

@AutoWired
export class EditBeneficialOwnerLogic extends Logic {
    @Inject private paymentClient: payments.PaymentClient;

    async execute(request: models.EditBeneficialOwnerRequest): Promise<BeneficialOwner> {
        const beneficialOwner = new BeneficialOwner(request);
        const response = await this.paymentClient.editBusinessVerifiedBeneficialOwner(request.id, beneficialOwner);
        return await this.paymentClient.getBusinessVerifiedBeneficialOwner(response);
    }
}

@AutoWired
export class AddBeneficialOwnerRetryLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(request: models.RetryBeneficialOwnerRequest, tenantId: string): Promise<any> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }
        if (!tenant.paymentsUri) {
            throw new Errors.ConflictError('Could not add beneficial owner for tenant, no tenant company');
        }
        if (tenant.businessType == payments.customers.BUSINESS_TYPE.Sole) {
            throw new Errors.ConflictError('Sole proprietorship companies cannot have beneficial owners');
        }
        const beneficialOwner = new BeneficialOwner(request);
        const response = await this.paymentClient.retryBusinessVerifiedBeneficialOwner(request.id, beneficialOwner);
        return await this.paymentClient.getBusinessVerifiedBeneficialOwner(response);
    }
}

export class BeneficialOwnerError extends Error {
    constructor(message: string) {
        super(message);
    }
}
