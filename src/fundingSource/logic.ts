import {Logic} from '../logic';
import {Errors} from 'typescript-rest';
import {FundingSourceService} from './services';
import {ProfileService} from '../profile/service';
import {AutoWired, Inject} from 'typescript-ioc';
import {FundingSource, Statuses as VerificationStatuses} from './models';
import {transaction} from 'objection';
import * as dwolla from '../dwolla';
import {UserService} from '../user/service';
import {User} from '../user/models';
import * as profiles from '../profile/models';
import {Profile, Statuses} from '../profile/models';
import * as db from '../db';

@AutoWired
class CreateFundingSourceLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private profileService: ProfileService;
    @Inject private fundingSourceService: FundingSourceService;

    async execute(user: User, fundingSource: FundingSource): Promise<FundingSource> {
        // const user = await this.userService.get(userId);
        // if (!user) {
        //     throw new Errors.NotFoundError('user cannot be found');
        // }

        const logic = new GetUserFundingSourcesLogic(this.context);
        const fundingSources = await logic.execute(user);
        if (!fundingSources || fundingSources.length == 0) {
            fundingSource.isDefault = true;
        }

        return await transaction(this.profileService.transaction(), async trx => {
            const fundingSourceResult = await this.fundingSourceService.insert(fundingSource, trx);
            await this.profileService.addFundingSource(user.baseProfile, fundingSource, trx);

            // update the user's status
            user.tenantProfile.status = Statuses.active;
            user.baseProfile.status = Statuses.active;
            await this.profileService.update(user.baseProfile, trx);
            await this.profileService.update(user.tenantProfile, trx);

            return fundingSourceResult;
        });
    }
}

@AutoWired
export class GetUserFundingSourcesLogic extends Logic {
    @Inject private fundingService: FundingSourceService;

    async execute(user: User): Promise<Array<FundingSource>> {
        // NOTE: or clause to check both tenant and base profiles
        // for funding sources in order to be backwards compatible
        const query = this.fundingService
            .query()
            .where(`${db.Tables.fundingSources}.profileId`, user.baseProfile.id)
            .orWhere(`${db.Tables.fundingSources}.profileId`, user.tenantProfile.id);
        return await query;
    }
}

@AutoWired
export class GetDefaultFundingSourceLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private fundingService: FundingSourceService;

    async execute(userId: string): Promise<FundingSource> {
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        // NOTE: or clause to check both tenant and base profiles
        // for funding sources in order to be backwards compatible
        const query = this.fundingService
            .query()
            .where(`${db.Tables.fundingSources}.profileId`, user.baseProfile.id)
            .orWhere(`${db.Tables.fundingSources}.profileId`, user.tenantProfile.id)
            .andWhere('isDefault', true)
            .first();

        return <FundingSource>(<any>await query);
    }
}

@AutoWired
export class SetDefaultFundingSourceLogic extends Logic {
    @Inject private profileService: ProfileService;
    @Inject private fundingSourceService: FundingSourceService;

    async execute(fundingSourceId, userId: string): Promise<any> {
        const fundingSource = await this.fundingSourceService.get(fundingSourceId);
        if (!fundingSource) {
            throw new Errors.NotFoundError(`Could not find funding source for id ${fundingSourceId}`);
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
    @Inject private dwollaClient: dwolla.Client;

    async execute(data: any, user: User): Promise<any> {
        const profile = user.baseProfile;
        const sourceUri = await this.dwollaClient.createFundingSource(
            profile.paymentsUri,
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
            isDefault: false,
            paymentsUri: sourceUri,
        });

        const logic = new CreateFundingSourceLogic(this.context);
        return await logic.execute(user, fundingSource);
    }
}

@AutoWired
export class DeleteFundingSourceLogic extends Logic {
    @Inject private dwollaClient: dwolla.Client;
    @Inject private profileService: ProfileService;
    @Inject private fundingSourceService: FundingSourceService;

    async execute(id: string, user: User): Promise<any> {
        const fundingSource: FundingSource = await this.fundingSourceService.get(id);
        if (!fundingSource) {
            throw new Errors.NotFoundError(`Could not find funding source by id ${id}`);
        }

        if (fundingSource.profileId != user.baseProfile.id) {
            await this._deleteFundingSource(user.baseProfile, fundingSource);
        } else if (fundingSource.profileId != user.tenantProfile.id) {
            await this._deleteFundingSource(user.tenantProfile, fundingSource);
        } else {
            throw new Errors.ConflictError('Funding source can only be delete by its owner.');
        }
    }

    private async _deleteFundingSource(profile: Profile, fundingSource: FundingSource) {
        await this.dwollaClient.deleteFundingSource(fundingSource.paymentsUri);
        await transaction(this.profileService.transaction(), async trx => {
            await profile
                .$relatedQuery(profiles.Relations.fundingSources, trx)
                .unrelate()
                .where(`${FundingSource.tableName}.id`, fundingSource.id);
            await this.fundingSourceService.delete(fundingSource, trx);
        });
    }
}

@AutoWired
export class InitiateContractorFundingSourceVerificationLogic extends Logic {
    @Inject private fundingService: FundingSourceService;
    @Inject private client: dwolla.Client;

    async execute(id: string) {
        const fundingSource = await this.fundingService.get(id);
        if (!fundingSource) {
            throw new Errors.NotFoundError('Funding source not found');
        }

        if (fundingSource.status) {
            throw new Errors.NotAcceptableError('Funding source verification cannot be initiated');
        }

        if (!(await this.client.createFundingSourceMicroDeposit(fundingSource.paymentsUri))) {
            throw new Errors.NotAcceptableError('Funding source verification initiation failed');
        }

        fundingSource.status = VerificationStatuses.initiated;
        await this.fundingService.update(fundingSource);
    }
}

@AutoWired
export class VerifyContractorFundingSourceLogic extends Logic {
    @Inject private fundingService: FundingSourceService;
    @Inject private client: dwolla.Client;

    async execute(amount1: number, amount2: number, id: string) {
        const fundingSource = await this.fundingService.get(id);
        if (!fundingSource) {
            throw new Errors.NotFoundError('Funding source not found');
        }

        if (fundingSource.status != VerificationStatuses.initiated) {
            throw new Errors.NotAcceptableError('Funding source verification not initiated');
        }

        try {
            await this.client.verifyFundingSourceMicroDeposit(fundingSource.paymentsUri, amount1, amount2);
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

        fundingSource.status = VerificationStatuses.verified;
        await this.fundingService.update(fundingSource);
    }
}

@AutoWired
export class GetIavTokenLogic extends Logic {
    @Inject private client: dwolla.Client;

    async execute(user: User) {
        try {
            return await this.client.getIavToken(user.baseProfile.paymentsUri);
        } catch (e) {
            if (e instanceof dwolla.DwollaRequestError) {
                throw e.toValidationError();
            }

            throw e;
        }
    }
}

@AutoWired
export class AddVerifyingFundingSourceLogic extends Logic {
    @Inject private fundingService: FundingSourceService;
    @Inject private client: dwolla.Client;

    async execute(user: User, uri: string): Promise<FundingSource> {
        if (await this.fundingService.getByPaymentsUri(uri)) {
            throw new Errors.NotAcceptableError('Funding source with provided uri is already registered');
        }

        let dwollaFunding;
        try {
            dwollaFunding = await this.client.getFundingSource(uri);
        } catch (e) {
            throw new Errors.NotFoundError(e.toValidationError().message);
        }

        const fundingSource: FundingSource = FundingSource.factory({
            type: dwollaFunding.type,
            name: dwollaFunding.name,
            profileId: user.baseProfile.id,
            isDefault: false,
            paymentsUri: uri,
            verificationStatus: dwollaFunding.verificationStatus(),
        });

        const logic = new CreateFundingSourceLogic(this.context);
        return await logic.execute(user, fundingSource);
    }
}
