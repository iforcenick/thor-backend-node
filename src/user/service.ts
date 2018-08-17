import {AutoWired, Inject} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import * as role from './role';
import * as profile from '../profile/models';
import {ProfileService} from '../profile/service';
import {transaction} from 'objection';

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
            tenant: (builder) => {
                builder.where('tenantId', this.getTenantId());
            }
        });
        // query.debug();

        return query;
    }

    async createWithProfile(user: models.User): Promise<models.User> {
        const roleEntity = await this.getRole(role.models.Types.admin);

        await transaction(models.User.knex(), async (trx) => {
            user = await this.insert(user, trx);
            const profileEntity = await this.profileService.createProfile(user.toJSON(), [roleEntity], trx);
            await user
                .$relatedQuery(models.Relations.profile, trx)
                .relate(profileEntity.id);
        });

        return user;
    }

    async findByPhone(phone: string): Promise<models.User> {
        return await this.tenantContext(this.modelType.query().findOne({phone: phone}));
    }

    async findByEmail(email: string): Promise<models.User> {
        return await this.tenantContext(this.modelType.query().findOne({email: email}));
    }

    async getRole(role: role.models.Types): Promise<role.models.Role> {
        return await this.tenantContext(this.rolesService.find(role));
    }

    async checkPassword(password: string, userPassword: string) {
        return await bcrypt.compare(password, userPassword);
    }

    async authenticate(login: string, password: string) {
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

    async generateJwt(user) {
        return jwt.sign(
            {
                id: user.hyperledgerId,
            },
            this.config.get('authorization.jwtSecret'),
            {
                expiresIn: this.config.get('authorization.tokenExpirationTime')
            }
        );
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }
}