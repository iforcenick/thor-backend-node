import {Logic} from '../logic';
import {AutoWired, Inject} from 'typescript-ioc';
import {UserService} from '../user/service';
import {Profile} from '../profile/models';
import {Errors} from 'typescript-rest';
import {Logger} from '../logger';

@AutoWired
export class UserAuthorization extends Logic {
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
            this.logger.error(err.message);
            throw new Errors.UnauthorizedError();
        }

        if (!user) {
            this.logger.debug(`User [${login}] not found`);
            throw new Errors.UnauthorizedError();
        }

        return user;
    }

    private async findTenant(login: string): Promise<string> {
        const query = Profile.query();
        query.where('email', login).first();
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