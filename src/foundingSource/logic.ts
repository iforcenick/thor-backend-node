import {Logic} from '../logic';
import {Errors} from 'typescript-rest';
import {FundingSourceService} from './services';
import {ProfileService} from '../profile/service';
import {AutoWired, Inject} from 'typescript-ioc';
import {FundingSource, VerificationStatuses} from './models';
import {transaction} from 'objection';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {MailerService} from '../mailer';
import {Logger} from '../logger';
import {User} from '../user/models';
import {Profile} from '../profile/models';
import * as profiles from '../profile/models';
import {TenantService} from "../tenant/service";

@AutoWired
export class SetDefaultFundingSourceLogic extends Logic {
    @Inject protected profileService: ProfileService;
    @Inject protected fundingSourceService: FundingSourceService;

    async execute(fundingId, userId: string): Promise<any> {
        const fundingSource = await this.fundingSourceService.get(fundingId);
        if (!fundingSource) {
            throw new Errors.NotFoundError(`Could not find funding source for id ${fundingId}`);
        }

        const profile = await this.profileService.get(fundingSource.profileId);
        if (profile.userId != userId) {
            throw new Errors.InternalServerError('Funding source can only be edited by its owner.');
        }

        await this.fundingSourceService.setDefault(fundingSource);
        return fundingSource;
    }
}

@AutoWired
export class CreateUserFundingSourceLogic extends Logic {
    @Inject protected dwollaClient: dwolla.Client;
    @Inject protected userService: UserService;
    @Inject protected profileService: ProfileService;
    @Inject protected fundingSourceService: FundingSourceService;
    @Inject protected mailer: MailerService;
    @Inject protected logger: Logger;

    async execute(data: any, user: User): Promise<any> {
        const profile = user.tenantProfile;
        const sourceUri = await this.dwollaClient.createFundingSource(
            profile.dwollaUri,
            data.routing,
            data.account,
            'checking',
            data.name,
        );

        const fundingSource: FundingSource = FundingSource.factory({
            routing: data.routing,
            account: data.account,
            type: 'checking',
            name: data.name,
            profileId: profile.id,
            tenantId: profile.tenantId,
            isDefault: false,
            dwollaUri: sourceUri
        });

        const sourceInfo = {
            sourceUri: profile.dwollaSourceUri,
            routing: data.routing,
            account: data.account,
        };

        const fundingSources = await this.fundingSourceService.getAllFundingSource(user.id);
        if (!fundingSources || fundingSources.length == 0) {
            fundingSource.isDefault = true;
        }

        try {
            await this.mailer.sendFundingSourceCreated(user, sourceInfo);
        } catch (e) {
            this.logger.error(e.message);
        }

        let fundingSourceResult;

        await transaction(this.profileService.transaction(), async trx => {
            fundingSourceResult = await this.fundingSourceService.insert(fundingSource, trx);
            await this.profileService.addFundingSource(profile, fundingSource, trx);
        });

        return fundingSourceResult;
    }
}

@AutoWired
export class DeleteFundingSourceLogic extends Logic {
    @Inject protected dwollaClient: dwolla.Client;
    @Inject protected profileService: ProfileService;
    @Inject protected fundingSourceService: FundingSourceService;
    @Inject protected mailer: MailerService;
    @Inject protected logger: Logger;

    async execute(id: string, user: User): Promise<any> {
        const profile: Profile = user.tenantProfile;
        const sourceInfo = {
            sourceUri: profile.dwollaUri,
            routing: profile.dwollaRouting,
            account: profile.dwollaAccount,
        };

        const fundingSource: FundingSource = await this.fundingSourceService.get(id);
        if (!fundingSource) {
            throw new Errors.NotFoundError(`Could not find funding source by id ${id}`);
        }

        if (fundingSource.profileId != profile.id) {
            throw new Errors.ConflictError('Funding source can only be delete by its owner.');
        }

        await this.dwollaClient.deleteFundingSource(fundingSource.dwollaUri);

        try {
            await this.mailer.sendFundingSourceRemoved(user, sourceInfo);
        } catch (e) {
            this.logger.error(e.message);
        }

        await transaction(this.profileService.transaction(), async trx => {
            // TODO: move
            await profile.$relatedQuery(profiles.Relations.fundingSources).unrelate().where(`${FundingSource.tableName}.id`, fundingSource.id);
            await this.fundingSourceService.delete(fundingSource, trx);
        });

        return undefined;
    }
}

@AutoWired
export class InitiateContractorFundingSourceVerificationLogic extends Logic {
    @Inject private fundingService: FundingSourceService;
    @Inject private client: dwolla.Client;

    async execute(id: string) {
        const funding = await this.fundingService.get(id);
        if (!funding) {
            throw new Errors.NotFoundError('Funding source not found');
        }

        if (funding.verificationStatus) {
            throw new Errors.NotAcceptableError('Funding source verification cannot be initiated');
        }

        if (!await this.client.createFundingSourceMicroDeposit(funding.dwollaUri)) {
            throw new Errors.NotAcceptableError('Funding source verification initiation failed');
        }

        funding.verificationStatus = VerificationStatuses.initiated;
        await this.fundingService.update(funding);
    }
}

@AutoWired
export class VerifyContractorFundingSourceLogic extends Logic {
    @Inject private fundingService: FundingSourceService;
    @Inject private client: dwolla.Client;

    async execute(amount1, amount2: number, id: string) {
        const funding = await this.fundingService.get(id);
        if (!funding) {
            throw new Errors.NotFoundError('Funding source not found');
        }

        if (funding.verificationStatus != VerificationStatuses.initiated) {
            throw new Errors.NotAcceptableError('Funding source verification not initiated');
        }

        try {
            await this.client.verifyFundingSourceMicroDeposit(funding.dwollaUri, amount1, amount2);
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

        funding.verificationStatus = VerificationStatuses.completed;
        await this.fundingService.update(funding);
    }
}