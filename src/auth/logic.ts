import {Logic} from '../logic';
import {AutoWired, Inject} from 'typescript-ioc';
import {UserService} from '../user/service';
import {Profile} from '../profile/models';
import {Errors} from 'typescript-rest';
import {Logger} from '../logger';
import {Auth, AuthType} from './models';
import {User} from '../user/models';
import {Config} from '../config';

const passportJWT = require('passport-jwt');

const jwt = require('jsonwebtoken');

@AutoWired
export class UserAuthorization extends Logic {
    @Inject private userService: UserService;
    @Inject private logger: Logger;
    @Inject private config: Config;

    async execute(login, password: string): Promise<any> {
        const tenant = await this.findTenant(login);
        if (!tenant) {
            this.logger.error(`Tenant for user [${login}] not found`);
            throw new Errors.UnauthorizedError();
        }

        let user;

        try {
            user = await this.authenticate(login, password, tenant);
        } catch (err) {
            this.logger.error(err.message);
            throw new Errors.UnauthorizedError();
        }

        if (!user) {
            this.logger.debug(`User [${login}] not found`);
            throw new Errors.UnauthorizedError();
        }

        user.token = await (new GenerateJwtLogic()).execute(user);

        return user;
    }

    private async findTenant(login: string): Promise<string> {
        const query = Profile.query();
        query.where('email', login);
        query.whereNotNull('tenantId').first();
        const profile: any = await query;

        return profile ? profile.tenantId : null;
    }

    private async authenticate(login: string, password: string, tenant: string) {
        const user = await this.userService.findByEmailAndTenant(login, tenant);
        if (!user) {
            return null;
        }

        const check = await this.userService.checkPassword(password, user.password);

        if (check !== true) {
            return null;
        }
        return user;
    }
}

@AutoWired
export class UserChangePassword extends Logic {
    @Inject private userService: UserService;
    @Inject private logger: Logger;

    async execute(oldPassword, newPassword: string): Promise<boolean> {
        const user = await this.userService.get(this.context.getUserId());
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        try {
            const isOldPasswordValid = await this.userService.checkPassword(oldPassword, user.password);
            if (!isOldPasswordValid) {
                throw Error('Invalid old password');
            }

            const isNewOldPasswordSame = await this.userService.checkPassword(newPassword, user.password);
            if (isNewOldPasswordSame) {
                throw Error('New password is the same as the old one');
            }

            const newPasswordHash = await this.userService.hashPassword(newPassword);
            await user.$query().patch({password: newPasswordHash});
        } catch (e) {
            this.logger.debug(e.message);
            throw new Errors.ConflictError(e.message);
        }

        return true;
    }
}

@AutoWired
export class GenerateJwtLogic {
    @Inject private config: Config;

    async execute(user: User): Promise<any> {
        const auth = new Auth();
        auth.type = AuthType.TENANT;
        auth.userId = user.id;
        auth.tenantId = user.tenantProfile.tenantId;
        auth.roles = user.tenantProfile.roles.map((role) => {
            return role.name;
        });

        return jwt.sign(auth.toJwt(), this.config.get('authorization.jwtSecret'), {
            expiresIn: this.config.get('authorization.tokenExpirationTime'),
        });
    }
}

@AutoWired
export class DecodeJwtLogic {
    @Inject private config: Config;
    @Inject private logger: Logger;

    execute() {
        const callback = (payload, cb) => {
            try {
                return cb(null, Auth.fromJwt(payload));
            } catch (e) {
                this.logger.error(e.message);
                throw new Errors.UnauthorizedError();
            }
        };

        return new passportJWT.Strategy(
            {
                jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: this.config.get('authorization.jwtSecret')
            },
            callback
        );
    }
}
