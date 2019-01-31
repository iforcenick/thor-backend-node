import * as objection from 'objection';
import {AutoWired, Inject} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import {Config} from '../config';
import {Logger} from '../logger';
import {Logic} from '../logic';
import {Profile, Statuses} from '../profile/models';
import {Auth, AuthType} from './models';
import {User} from '../user/models';
import * as invitations from '../invitation/models';
import {UserService} from '../user/service';
import {InvitationService} from '../invitation/service';
import {ProfileService} from '../profile/service';

const passportJWT = require('passport-jwt');
const jwt = require('jsonwebtoken');

@AutoWired
export class UserAuthorizationLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private logger: Logger;

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
            this.logger.error(err);
            throw new Errors.UnauthorizedError();
        }

        if (!user) {
            this.logger.debug(`User [${login}] not found`);
            throw new Errors.UnauthorizedError();
        }

        user.token = await new GenerateJwtLogic().execute(user);

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
export class RegisterUserLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private invitationService: InvitationService;
    @Inject private profileService: ProfileService;

    async execute(invitationToken: string, email: string, password: string): Promise<any> {
        const invitation = await this.invitationService.getForAllTenants(invitationToken);
        if (!invitation) {
            throw new Errors.NotFoundError('Invitation not found');
        }

        if (!invitation.isPending()) {
            throw new Errors.NotAcceptableError('Invitation already used');
        }

        if (invitation.email != email) {
            throw new Errors.ConflictError('Emails do not match');
        }

        this.userService.setTenantId(invitation.tenantId);
        const user = await this.userService.get(invitation.userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        user.password = await this.userService.hashPassword(password);
        // TODO: create function for the status state machine
        user.tenantProfile.status = Statuses.profile;

        await objection.transaction(this.invitationService.transaction(), async _trx => {
            // create a new base profile with payment account if none exists
            await this.userService.update(user, _trx);
            if (!user.baseProfile) {
                const baseProfile = Profile.factory({
                    status: user.tenantProfile.status,
                    email: user.tenantProfile.email,
                    userId: user.id,
                });
                await this.profileService.insert(baseProfile, _trx, false);
            }
            await this.profileService.update(user.tenantProfile, _trx);

            invitation.status = invitations.Status.used;
            return await this.invitationService.update(invitation, _trx);
        });

        const token = await new GenerateJwtLogic().execute(user);
        return {...user, token};
    }
}

@AutoWired
export class UserChangePasswordLogic extends Logic {
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
            this.logger.debug(e);
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
        auth.roles = user.tenantProfile.roles.map(role => {
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
                this.logger.error(e);
                throw new Errors.UnauthorizedError();
            }
        };

        return new passportJWT.Strategy(
            {
                jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: this.config.get('authorization.jwtSecret'),
            },
            callback,
        );
    }
}
