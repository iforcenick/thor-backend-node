import {AutoWired, Inject} from 'typescript-ioc';
import {CreateTenantFundingSourceRequest} from './models';
import * as dwolla from '../../dwolla';
import {TenantService} from '../service';
import {Tenant} from '../models';
import {Logic} from '../../logic';
import {Errors} from 'typescript-rest';
import {VerificationStatuses} from '../../foundingSource/models';


@AutoWired
export class CreateTenantFundingSourceLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private tenantService: TenantService;

    async execute(request: CreateTenantFundingSourceRequest, tenantId: string): Promise<Tenant> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (tenant.fundingSourceUri) {
            throw new Errors.NotAcceptableError('Could not add more funding sources');
        }

        tenant.fundingSourceUri = await this.dwollaClient.createFundingSource(
            tenant.dwollaUri, request.routing,
            request.account, request.bankAccountType, request.name
        );

        tenant.fundingSourceName = request.name;
        await this.tenantService.update(tenant);

        return tenant;
    }
}

@AutoWired
export class GetTenantFundingSourceLogic extends Logic {
    @Inject private tenantService: TenantService;

    async execute(tenantId: string): Promise<Tenant> {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (!tenant.fundingSourceUri) {
            throw new Errors.NotFoundError('Tenant funding source not found');
        }

        return tenant;
    }
}

@AutoWired
export class DeleteTenantFundingSourcesLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private client: dwolla.Client;

    async execute(tenantId: string) {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant) {
            throw new Errors.NotFoundError('Tenant not found');
        }

        if (!tenant.fundingSourceUri) {
            throw new Errors.NotFoundError('Funding source not found');
        }

        await this.client.deleteFundingSource(tenant.fundingSourceUri);

        tenant.fundingSourceUri = null;
        tenant.fundingSourceName = null;
        tenant.fundingSourceVerificationStatus = null;

        await this.tenantService.update(tenant);
    }
}

@AutoWired
export class InitiateTenantFundingSourceVerificationLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private client: dwolla.Client;

    async execute(tenantId: string) {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant.fundingSourceUri) {
            throw new Errors.NotFoundError('Funding source not found');
        }

        if (tenant.fundingSourceVerificationStatus) {
            throw new Errors.NotAcceptableError('Funding source verification cannot be initiated');
        }

        if (!await this.client.createFundingSourceMicroDeposit(tenant.fundingSourceUri)) {
            throw new Errors.NotAcceptableError('Funding source verification initiation failed');
        }

        tenant.fundingSourceVerificationStatus = VerificationStatuses.initiated;
        await this.tenantService.update(tenant);
    }
}

@AutoWired
export class VerifyTenantFundingSourceLogic extends Logic {
    @Inject private tenantService: TenantService;
    @Inject private client: dwolla.Client;

    async execute(amount1, amount2: number, tenantId: string) {
        const tenant = await this.tenantService.get(tenantId);
        if (!tenant.fundingSourceUri) {
            throw new Errors.NotFoundError('Funding source not found');
        }

        if (tenant.fundingSourceVerificationStatus != VerificationStatuses.initiated) {
            throw new Errors.NotAcceptableError('Funding source verification not initiated');
        }

        try {
            await this.client.verifyFundingSourceMicroDeposit(tenant.fundingSourceUri, amount1, amount2);
        } catch (e) {
            if (e instanceof dwolla.DwollaRequestError) {
                // I HATE DWOLLA SO MUCH SINCE THEY MADE ME DO IT!
                if (e.message.search('Wrong amount') != -1) {
                    throw new Errors.ConflictError('Wrong amounts');
                }

                e.message = e.message.replace(/\/value/g, '');
                throw e.toValidationError();
            }

            throw e;
        }

        tenant.fundingSourceVerificationStatus = VerificationStatuses.completed;
        await this.tenantService.update(tenant);
    }
}