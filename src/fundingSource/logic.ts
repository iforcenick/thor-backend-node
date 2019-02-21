import {transaction} from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import * as db from '../db';
import {DwollaRequestError} from '../payment/dwolla';
import {Logic} from '../logic';
import {FundingSource, Statuses as VerificationStatuses} from './models';
import {User} from '../user/models';
import {Statuses} from '../profile/models';
import * as payments from '../payment';
import {UserService} from '../user/service';
import {FundingSourceService} from './services';
import {ProfileService} from '../profile/service';

@AutoWired
class CreateFundingSourceLogic extends Logic {
    @Inject private profileService: ProfileService;
    @Inject private fundingSourceService: FundingSourceService;

    async execute(user: User, fundingSource: FundingSource): Promise<FundingSource> {
        const logic = new GetFundingSourcesLogic(this.context);
        const fundingSources = await logic.execute(user.id, 1, 1);
        if (!fundingSources || fundingSources.pagination.total == 0) {
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
export class GetFundingSourcesLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private fundingService: FundingSourceService;

    async execute(userId: string, page: number, limit: number): Promise<db.Paginated<FundingSource>> {
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError();
        }

        // NOTE: or clause to check both tenant and base profiles
        // for funding sources in order to be backwards compatible
        const profileId = user.baseProfile ? user.baseProfile.id : user.tenantProfile.id;
        const query = this.fundingService.query().where(`${db.Tables.fundingSources}.profileId`, profileId);
        const pag = this.userService.addPagination(query, page, limit);
        const fundingSources = await query;
        return new db.Paginated(new db.Pagination(pag.page, pag.limit, fundingSources.total), fundingSources.results);
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
        const profileId = user.baseProfile ? user.baseProfile.id : user.tenantProfile.id;
        const query = this.fundingService
            .query()
            .where(`${db.Tables.fundingSources}.profileId`, profileId)
            .andWhere('isDefault', true)
            .first();

        const fundingSource = await query;
        if (!fundingSource) {
            throw new Errors.NotFoundError();
        }

        return fundingSource;
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
export class CreateFundingSourceFromBankAccountLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(data: any, userId: string): Promise<any> {
        try {
            const user = await this.userService.get(userId);
            if (!user) {
                throw new Errors.NotFoundError('user cannot be found');
            }

            const profile = user.baseProfile;
            const sourceUri = await this.paymentClient.createFundingSource(
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
        } catch (err) {
            if (err instanceof DwollaRequestError) {
                throw err.toValidationError(null, {
                    accountNumber: 'account',
                    routingNumber: 'routing',
                });
            }
            throw err;
        }
    }
}

@AutoWired
export class DeleteFundingSourceLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private paymentClient: payments.PaymentClient;
    @Inject private fundingSourceService: FundingSourceService;

    async execute(id: string, userId: string): Promise<any> {
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError();
        }

        const fundingSource: FundingSource = await this.fundingSourceService.get(id);
        if (!fundingSource) {
            throw new Errors.NotFoundError(`Could not find funding source by id ${id}`);
        }

        if (fundingSource.profileId != user.baseProfile.id || fundingSource.profileId != user.tenantProfile.id) {
            await this._deleteFundingSource(fundingSource);
        } else {
            throw new Errors.ConflictError('Funding source can only be delete by its owner.');
        }
    }

    private async _deleteFundingSource(fundingSource: FundingSource) {
        await transaction(this.fundingSourceService.transaction(), async trx => {
            await this.fundingSourceService
                .query(trx)
                .table(db.Tables.profilesFundingSources)
                .del()
                .where('fundingSourceId', fundingSource.id);
            await this.fundingSourceService.delete(fundingSource, trx);
            await this.paymentClient.deleteFundingSource(fundingSource.paymentsUri);
        });
    }
}

@AutoWired
export class InitiateFundingSourceVerificationLogic extends Logic {
    @Inject private fundingService: FundingSourceService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(id: string) {
        const fundingSource = await this.fundingService.get(id);
        if (!fundingSource) {
            throw new Errors.NotFoundError('Funding source not found');
        }

        if (fundingSource.status) {
            throw new Errors.NotAcceptableError('Funding source verification cannot be initiated');
        }

        if (!(await this.paymentClient.createFundingSourceMicroDeposit(fundingSource.paymentsUri))) {
            throw new Errors.NotAcceptableError('Funding source verification initiation failed');
        }

        fundingSource.status = VerificationStatuses.initiated;
        await this.fundingService.update(fundingSource);
    }
}

@AutoWired
export class VerifyFundingSourceLogic extends Logic {
    @Inject private fundingService: FundingSourceService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(amount1: number, amount2: number, id: string) {
        const fundingSource = await this.fundingService.get(id);
        if (!fundingSource) {
            throw new Errors.NotFoundError('Funding source not found');
        }

        if (fundingSource.status != VerificationStatuses.initiated) {
            throw new Errors.NotAcceptableError('Funding source verification not initiated');
        }

        try {
            await this.paymentClient.verifyFundingSourceMicroDeposit(fundingSource.paymentsUri, amount1, amount2);
        } catch (e) {
            if (e instanceof DwollaRequestError) {
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
    @Inject private userService: UserService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(userId: string) {
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError();
        }
        try {
            return await this.paymentClient.getIavToken(user.baseProfile.paymentsUri);
        } catch (e) {
            if (e instanceof DwollaRequestError) {
                throw e.toValidationError();
            }
            throw e;
        }
    }
}

@AutoWired
export class CreateFundingSourceFromIavLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private fundingService: FundingSourceService;
    @Inject private paymentClient: payments.PaymentClient;

    async execute(userId: string, uri: string): Promise<FundingSource> {
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError();
        }

        if (await this.fundingService.getByPaymentsUri(uri)) {
            throw new Errors.NotAcceptableError('Funding source with provided uri is already registered');
        }

        let dwollaFunding;
        try {
            dwollaFunding = await this.paymentClient.getFundingSource(uri);
        } catch (e) {
            throw new Errors.NotFoundError(e.toValidationError().message);
        }

        const fundingSource: FundingSource = FundingSource.factory({
            type: dwollaFunding.type,
            name: dwollaFunding.name,
            profileId: user.baseProfile.id,
            isDefault: false,
            paymentsUri: uri,
            status: dwollaFunding.verificationStatus(),
        });

        const logic = new CreateFundingSourceLogic(this.context);
        return await logic.execute(user, fundingSource);
    }
}
