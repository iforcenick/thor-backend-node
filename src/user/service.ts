import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import * as models from './models';
import * as db from '../db';
import * as role from './role';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

@Singleton
@AutoWired
export class UserService extends db.ModelService<models.User> {
    protected modelType = models.User;
    @Inject protected rolesService: role.service.UserService;
    protected eager = '[roles]';

    async findByPhone(phone: string): Promise<models.User> {
        return await this.modelType.query().findOne({phone: phone});
    }

    async findByEmail(email: string): Promise<models.User>  {
        return await this.modelType.query().findOne({email: email});
    }

    async getRole(role: role.models.Types): Promise<role.models.Role>  {
        return await this.rolesService.find(role);
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