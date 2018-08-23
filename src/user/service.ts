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

@AutoWired
export class UserService extends db.ModelService<models.User> {
    protected modelType = models.User;
    protected rolesService: role.service.RoleService;
    protected profileService: ProfileService;

    constructor(@Inject rolesService: role.service.RoleService, @Inject profileService: ProfileService) {
        super();
        this.rolesService = rolesService;
        this.profileService = profileService;
    }

    getOptions(query) {
        query.eager(`${models.Relations.profile}(tenant).[${profile.Relations.roles}]`, {
            tenant: builder => {
                const tenantId = this.getTenantId();
                builder.orWhere(function () {
                    this.where('tenantId', tenantId).orWhere('tenantId', null);
                });
            },
        });
        // query.debug();

        return query;
    }

    getListOptions(query) {
        return this.getOptions(query);
    }

    async getAll() {
        return await this.tenantContext(this.getOptions(this.modelType.query()));
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

    async patch(id, data) {
        const user: models.User = await this.get(id);
        const profile = user.tenantProfile;
        return profile.$query().update(data);
    }
}
