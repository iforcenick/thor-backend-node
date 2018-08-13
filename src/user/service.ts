import {AutoWired, Singleton} from 'typescript-ioc';
import {User} from './models';
import * as db from '../db';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

@Singleton
@AutoWired
export class UserService extends db.ModelService<User> {
    protected modelType = User;

    async findByPhone(phone: string) {
        return this.modelType.query().findOne({phone: phone});
    }

    async findByEmail(email: string) {
        return this.modelType.query().findOne({email: email});
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