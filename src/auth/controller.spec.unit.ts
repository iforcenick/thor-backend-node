import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import {Container} from 'typescript-ioc';
import {Errors} from 'typescript-rest';
import {AuthController} from './controller';
import * as models from './models';
import * as users from '../user/models';
import * as profiles from '../profile/models';
import {UserService} from '../user/service';
import 'mocha';
import * as jwt from 'jsonwebtoken';
import {Config} from '../config';
import {sandbox} from '../test-setup.spec.unit';

chai.use(chaiAsPromised);
const expect = chai.expect;

const controller: AuthController = Container.get(AuthController);
const config = Container.get(Config);

describe('Auth login', () => {
    it('should throw ConflictError when invalid data is posted', async () => {
        const data: any = {};
        await expect(controller.login(data)).to.be.rejectedWith(Errors.ConflictError);
    });

    it('should throw UnauthorizedError when credentials are invalid', async () => {
        const data: models.LoginRequest = {
            login: 'test',
            password: 'test',
            tenant: 'test',
        };

        await expect(controller.login(data)).to.be.rejectedWith(Errors.UnauthorizedError);
    });

    it('should return user model with JWT token when credentials are correct', async () => {
        const service: UserService = (controller as any).service;
        const data: models.LoginRequest = {
            login: 'test',
            password: 'test',
            tenant: 'test',
        };
        const user = new users.User();
        const tenantProfile = new profiles.Profile();
        tenantProfile.tenantId = 'test';
        user.profiles = [new profiles.Profile(), tenantProfile];
        user.password = await service.hashPassword(data.password);

        sandbox.stub(service, 'findByEmailAndTenant').returns(user);
        const result = await controller.login(data);

        expect(result).to.not.be.undefined;
        expect(jwt.verify(result.token, config.get('authorization.jwtSecret'))).to.not.be.undefined;
    });
});