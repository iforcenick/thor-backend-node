import {AutoWired, Inject} from 'typescript-ioc';
import {CreateTenantFundingSourceRequest} from './models';
import * as dwolla from '../../dwolla';
import {TenantService} from '../service';
import {Tenant} from '../models';


@AutoWired
export class CreateTenantFundingSourceLogic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private tenantService: TenantService;

    async execute(request: CreateTenantFundingSourceRequest, tenantId: string): Promise<Tenant> {
        const tenant = await this.tenantService.get(tenantId);

        if (tenant.fundingSourceUri) {
            throw new Error('Could not add many funding sources.');
        }

        try {
            const fundingSourceUri = await this.dwollaClient
                .createFundingSource(tenant.dwollaUri, request.routing,
                    request.account, request.bankAccountType, request.name);

            tenant.fundingSourceUri = fundingSourceUri;
            tenant.fundingSourceAccount = request.account;
            tenant.fundingSourceRouting = request.routing;
            tenant.fundingSourceName = request.name;

            await this.tenantService.update(tenant);

            return tenant;
        } catch (e) {
            throw e;
        }
    }
}

@AutoWired
export class GetTenantFundingSourceLogic {
    @Inject private service: TenantService;

    async execute(tenantId: string): Promise<Tenant> {
        return await this.service.get(tenantId);
    }
}

@AutoWired
export class DeleteTenantFundingSourcesLogic {
    @Inject private service: TenantService;
    @Inject private client: dwolla.Client;

    async execute(tenantId: string) {
        const tenant = await this.service.get(tenantId);

        await this.client.deleteFundingSource(tenant.fundingSourceUri);

        tenant.fundingSourceUri = null;
        tenant.fundingSourceAccount = null;
        tenant.fundingSourceName = null;
        tenant.fundingSourceRouting = null;

        await this.service.update(tenant);
    }
}
