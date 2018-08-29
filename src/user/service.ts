import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import * as role from './role';
import * as profile from '../profile/models';
import {ProfileService} from '../profile/service';
import {transaction} from 'objection';
import * as _ from 'lodash';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('knex');

@AutoWired
export class UserService extends db.ModelService<models.User> {
    protected modelType = models.User;
    protected rolesService: role.service.RoleService;
    public profileService: ProfileService;

    constructor(@Inject rolesService: role.service.RoleService, @Inject profileService: ProfileService) {
        super();
        this.rolesService = rolesService;
        this.profileService = profileService;
    }

    getOptions(query) {
        query.whereNull('deletedAt');

        return query;
    }

    getListOptions(query) {
        return this.getOptions(query)
            .select(['users.id', knex.raw('sum(transactions.quantity * jobs.value) as rank')])
            .join('transactions', 'users.id', 'transactions.userId')
            .join('jobs', 'transactions.jobId', 'jobs.id')
            .groupBy('users.id')
            .orderBy('rank', 'desc')
            .max('transactions.createdAt as lastTransaction');
    }

    async getAll(
        page?: number,
        limit?: number,
        embed?: string,
        startDate?: string,
        endDate?: string,
        status?: string,
    ): Promise<db.Paginated<models.User>> {
        if (!page) {
            page = 0;
        }

        limit = this.paginationLimit(limit);
        const query = this.modelType.query();

        const eagerObject = {
            profiles: {
                roles: {
                    $modify: ['roles'],
                },
                $modify: ['profiles'],
            },
        };
        if (embed && embed.includes('transactions') && startDate && endDate) {
            query.whereBetween('transactions.createdAt', [startDate, endDate]);
            if (status) {
                query.where('transactions.status', status);
            }
            eagerObject['transactions'] = {$modify: ['transactions'], job: {$modify: ['job']}};
        }
        if (embed) {
            const relations = embed.split(',');
            if (relations.includes('transactions')) {
                eagerObject['transactions'] = {$modify: ['transactions'], job: {$modify: ['job']}};
            }
        }
        query.eager(eagerObject, {
            profiles: builder => {
                const tenantId = this.getTenantId();
                builder
                    .orWhere(function () {
                        this.where('tenantId', tenantId).orWhere('tenantId', null);
                    })
                    .select(['firstName', 'lastName']);
            },
            transactions: builder => {
                builder
                    .select([
                        'status',
                        'quantity',
                        'transactions.createdAt',
                        knex.raw('transactions.quantity * jobs.value as value'),
                    ])
                    .join('jobs', 'transactions.jobId', 'jobs.id')
                    .whereBetween('transactions.createdAt', [startDate, endDate]);
                if (status) {
                    builder.where('transactions.status', status);
                }
            },
            job: builder => {
                builder.select(['id', 'value', 'name', 'description']);
            },
            roles: builder => {
                builder.select(['name']);
            },
        });

        this.getListOptions(query);
        query.page(page, limit);

        const result = await this.tenantContext(query);
        return new db.Paginated(new db.Pagination(page, limit, result.total), result.results);
    }

    embed(query, embed) {
    }

    async createWithProfile(user: models.User, profile: profile.Profile): Promise<models.User> {
        const customerRole = await this.getRole(role.models.Types.customer);
        await transaction(this.transaction(), async trx => {
            user = await this.insert(user, trx);
            const baseProfile = _.clone(profile);
            baseProfile.dwollaUri = undefined;
            baseProfile.dwollaStatus = undefined;
            baseProfile.dwollaSourceUri = undefined;
            const profileEntity = await this.profileService.createProfile(profile, [customerRole], trx);
            const baseProfileEntity = await this.profileService.createProfile(baseProfile, [customerRole], trx, true);

            await user.$relatedQuery(models.Relations.profile, trx).relate(profileEntity.id);
            await user.$relatedQuery(models.Relations.profile, trx).relate(baseProfileEntity.id);
        });

        return user;
    }

    async delete(id: string) {
        const user = await this.getForAllTenants(id);
        user.deletedAt = new Date();
        await transaction(this.transaction(), async trx => {
            user.profiles.forEach(async p => {
                await this.profileService.anonymize(p, trx);
            });
            await this.update(user, trx);
        });
    }
    async findByPhone(phone: string): Promise<models.User> {
        return await this.tenantContext(this.getOptions(this.modelType.query().findOne({phone: phone})));
    }

    async findByEmail(email: string): Promise<models.User> {
        return await this.modelType
            .query()
            .join('profiles', 'users.id', 'profiles.userId')
            .where('profiles.email', email)
            .first()
            .eager('profiles.roles');
    }

    async getRole(role: role.models.Types): Promise<role.models.Role> {
        return await this.tenantContext(this.rolesService.find(role));
    }

    async checkPassword(password: string, userPassword: string) {
        return await bcrypt.compare(password, userPassword);
    }

    async changePassword(user: models.User, newPassword, oldPassword: string) {
        const isOldPasswordValid = await this.checkPassword(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw Error('Invalid old password');
        }

        const isNewOldPasswordSame = await this.checkPassword(newPassword, user.password);
        if (isNewOldPasswordSame) {
            throw Error('New password is the same as the old one');
        }

        const newPasswordHash = await this.hashPassword(newPassword);
        return user.$query().patch({password: newPasswordHash});
    }

    async authenticate(login: string, password: string, tenant: string) {
        this.tenant = tenant;
        const user = await this.findByEmail(login);
        if (!user) {
            return null;
        }

        const check = await this.checkPassword(password, user.password);

        if (check !== true) {
            return null;
        }
        return user;
    }

    async generateJwt(user: models.User) {
        return jwt.sign(user.toJSON(), this.config.get('authorization.jwtSecret'), {
            expiresIn: this.config.get('authorization.tokenExpirationTime'),
        });
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }
}
