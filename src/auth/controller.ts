import {Context, ContextRequest, Errors, PATCH, Path, POST, ServiceContext} from 'typescript-rest';
import {BaseController} from '../api';
import {Inject} from 'typescript-ioc';
import {Logger} from '../logger';
import {UserService} from '../user/service';
import {Config} from '../config';
import * as models from './models';
import {User, userRequestSchema} from '../user/models';
import {Security, Tags} from 'typescript-rest-swagger';
import {ProfileService} from '../profile/service';
import {Profile} from '../profile/models';
import * as dwolla from '../dwolla';
import {ValidationError} from '../errors';

@Path('/auth')
export class AuthController extends BaseController {
    @Inject private logger: Logger;
    @Inject private config: Config;
    @Inject private dwollaClient: dwolla.Client;
    private service: UserService;

    constructor(@Inject service: UserService) {
        super();
        this.service = service;
    }

    @Security('api_key')
    @PATCH
    @Path('/password')
    @Tags('auth')
    async changePassword(@ContextRequest context: ServiceContext, data: models.PasswordRequest) {
        const parsedData = await this.validate(data, models.passwordRequestSchema);
        const oldPassword = parsedData['oldPassword'];
        const newPassword = parsedData['newPassword'];
        const confirmPassword = parsedData['confirmPassword'];
        const user = await this.service.get(context['user'].id);

        if (newPassword !== confirmPassword) {
            throw new Errors.ConflictError('Passwords do not match');
        }

        try {
            await this.service.changePassword(user, newPassword, oldPassword);
        } catch (e) {
            this.logger.debug(e.message);
            throw new Errors.ConflictError(e.message);
        }
        return;
    }

    @POST
    @Path('/login')
    @Tags('auth')
    async login(data: models.LoginRequest): Promise<models.AuthUserResponse> {
        await this.validate(data, models.loginRequestSchema);
        let user;

        try {
            user = await this.service.authenticate(data.login, data.password, data.tenant);
        } catch (err) {
            this.logger.error(err);
            throw new Errors.UnauthorizedError();
        }

        if (!user) {
            this.logger.debug('User ' + data.login + ' not found');
            throw new Errors.UnauthorizedError();
        }

        const mapped = this.map(models.AuthUserResponse, user);
        mapped.token = await this.service.generateJwt(user);
        return mapped;
    }

    @POST
    @Path('registerDemo')
    @Tags('auth')
    async register(data: any) {
        const parsedData = await this.validate(data, userRequestSchema);
        ProfileService.validateAge(parsedData['profile']);
        let user = User.fromJson({});
        user.password = await this.service.hashPassword(data['password']);
        const profile = Profile.fromJson(parsedData['profile']);

        try {
            await this.dwollaClient.authorize();
            const customer = new dwolla.customer.Customer(dwolla.customer.factoryFromProfile(profile));
            delete profile['ssn'];
            profile.dwollaUri = await this.dwollaClient.createCustomer(customer);
            const dwollaCustomer = await this.dwollaClient.getCustomer(profile.dwollaUri);
            profile.dwollaStatus = dwollaCustomer.status;
            user = await this.service.createWithProfile(user, profile, data['tenant']);
            await user.$loadRelated('profiles.roles');
            const mapped = this.map(models.AuthUserResponse, user);

            mapped.token = await this.service.generateJwt(user);
            return mapped;
        } catch (err) {
            this.logger.error(err);
            if (err.body) {
                const {body} = err;
                if (body.code) {
                    const {code} = body;
                    if (code === 'ValidationError') {
                        throw new ValidationError(`Invalid value for Fields: profile,${body._embedded.errors[0].path.replace('/', '')}`);
                    }
                }
            }
            throw new Errors.InternalServerError(err.message);
        }
    }
}
