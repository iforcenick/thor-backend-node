import * as _ from 'lodash';
import {AutoWired, Inject} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import {Logic} from '../logic';
import {Statuses} from './models';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';

@AutoWired
export class GetProfileLogic extends Logic {
    @Inject private userService: UserService;

    async execute() {
        const user = await this.userService.get(this.context.getUserId());
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }
        return user.tenantProfile;
    }
}

@AutoWired
export class UpdateProfileLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private profileService: ProfileService;

    async execute(profileData: any) {
        const user = await this.userService.get(this.context.getUserId());
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        user.tenantProfile.merge(profileData);
        user.tenantProfile.status = Statuses.active;
        await this.profileService.update(user.tenantProfile);
        return user.tenantProfile;
    }
}
