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

    async execute(userId: string) {
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        if (user.isContractor) {
            return user.baseProfile;
        }
        return user.tenantProfile;
    }
}

@AutoWired
export class UpdateProfileLogic extends Logic {
    @Inject private userService: UserService;
    @Inject private profileService: ProfileService;

    async execute(userId: string, profileData: any) {
        const user = await this.userService.get(userId);
        if (!user) {
            throw new Errors.NotFoundError('User not found');
        }

        // is this an admin or a contractor
        let updatedProfile;
        if (user.isContractor()) {
            if (!user.baseProfile.dwollaUpdateAvailable()) {
                throw new Errors.NotAcceptableError('User not in a proper state for modification');
            }

            user.baseProfile.$set(profileData);
            updatedProfile = await this.profileService.updateWithDwolla(user.baseProfile);
        } else {
            user.tenantProfile.merge(profileData);
            user.tenantProfile.status = Statuses.active;
            updatedProfile = await this.profileService.update(user.tenantProfile);
        }

        return updatedProfile;
    }
}
