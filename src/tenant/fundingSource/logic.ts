import {AutoWired, Inject} from 'typescript-ioc';
import {CreateTenantFundingSourceRequest} from './models';
import * as dwolla from '../../dwolla';
import {TenantService} from '../service';
import {Tenant, Statuses} from '../models';
import {Logic} from '../../logic';
import {Errors} from 'typescript-rest';
import {FundingSource, Statuses as VerificationStatuses} from '../../fundingSource/models';
import {FundingSourceService} from '../../fundingSource/services';
import {UserService} from '../../user/service';
import {User} from '../../user/models';
import {ISource} from '../../dwolla/funding';
import {MailerService} from '../../mailer';
import {Logger} from '../../logger';


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

        if (!tenant.paymentsUri) {
            throw new Errors.NotAcceptableError('Tenant has to have company details');

        }

        tenant.fundingSourceUri = await this.dwollaClient.createFundingSource(
            tenant.paymentsUri, request.routing,
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
        tenant.fundingSourceStatus = null;

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

        if (tenant.fundingSourceStatus) {
            throw new Errors.NotAcceptableError('Funding source verification cannot be initiated');
        }

        if (!await this.client.createFundingSourceMicroDeposit(tenant.fundingSourceUri)) {
            throw new Errors.NotAcceptableError('Funding source verification initiation failed');
        }

        tenant.fundingSourceStatus = VerificationStatuses.initiated;
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

        if (tenant.fundingSourceStatus != VerificationStatuses.initiated) {
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

        tenant.fundingSourceStatus = VerificationStatuses.verified;
        await this.tenantService.update(tenant);
    }
}

@AutoWired
export class AddVerifyingFundingSourceForTenantLogic extends Logic {
    @Inject fundingService: FundingSourceService;
    @Inject tenantService: TenantService;
    @Inject client: dwolla.Client;
    @Inject mailer: MailerService;
    @Inject logger: Logger;

    async execute(user: User, uri: string): Promise<Tenant> {
        if (!uri) {
            throw new Errors.NotAcceptableError('Uri is empty');
        }
        if (await this.fundingService.getByPaymentsUri(uri)) {
            throw new Errors.NotAcceptableError('Funding source with provided uri is already registered');
        }
        let tenant = await this.tenantService.get(user.tenantProfile.tenantId);
        if (tenant.fundingSourceUri) {
            throw new Errors.NotAcceptableError('Could not add more funding sources');
        }

        let dwollaFunding: ISource;
        try {
            dwollaFunding = await this.client.getFundingSource(uri);
        } catch (e) {
            throw new Errors.NotFoundError(e.toValidationError().message);
        }

        tenant.fundingSourceName = dwollaFunding.name;
        tenant.fundingSourceUri = uri;
        tenant.fundingSourceStatus = dwollaFunding.verificationStatus();
        tenant.status = Statuses.active;

        tenant = await this.tenantService.update(tenant);

        const fundingSource: FundingSource = FundingSource.factory({
            type: dwollaFunding.type,
            name: dwollaFunding.name,
            createdAt: new Date(),
            verificationStatus: dwollaFunding.verificationStatus(),
        });

        return tenant;
    }
}

@AutoWired
export class GetIavTokenForTenantLogic extends Logic {
    @Inject protected userService: UserService;
    @Inject private client: dwolla.Client;

    async execute(tenant: Tenant) {
        try {
            return await this.client.getIavToken(tenant.paymentsUri);
        } catch (e) {
            if (e instanceof dwolla.DwollaRequestError) {
                throw e.toValidationError();
            }

            throw e;
        }
    }
}