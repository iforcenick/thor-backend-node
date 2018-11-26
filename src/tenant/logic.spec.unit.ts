import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import 'mocha';
import {AddTenantLogic} from './logic';

import {sandbox} from '../test-setup.spec.unit';
import {RequestContext} from '../context';
import {Container, Inject} from 'typescript-ioc';
import {TenantService} from '../tenant/service';
import {UserService} from '../user/service';
import {ProfileService} from '../profile/service';
import {RoleService} from '../user/role/service';
import {Role, Types} from '../user/role/models';
import {Config} from '../config';
import {Model} from '../db';

chai.use(chaiAsPromised);
const expect = chai.expect;
let sut: AddTenantLogic = undefined;
describe('InvitationLogic', () => {
    describe('Batch invitations', () => {
        beforeEach(async () => {
            const requestContext = new RequestContext(undefined);
            sandbox.stub(requestContext, 'getTenantId').returns('7bc0447a-ea99-4ba2-93bb-c84f5b325c50');
            sut = new AddTenantLogic(requestContext);



            const tenantService: TenantService = Container.get(TenantService);
            sandbox.stub(tenantService, 'getOneBy').returns(Promise.resolve(undefined));
            sandbox.stub(tenantService, 'insert').returns(Promise.resolve(true));
            sut.tenantService = tenantService;

            const userService = Container.get(UserService);
            sandbox.stub(userService, 'insert').returns(Promise.resolve(true));
            sut.userService = userService;

            const profileService = Container.get(ProfileService);
            sandbox.stub(profileService, 'insert').returns(Promise.resolve(true));
            sandbox.stub(profileService, 'setRoleForProfile').returns(Promise.resolve(true));
            sut.profileService = profileService;

            const roleService = Container.get(RoleService);
            sandbox.stub(roleService, 'find').returns(Promise.resolve(new Role().name = Types.admin));
            sut.roleService = roleService;

        });

        it('should create tenant', async () => {
            const tenant = await sut.execute('thor', 'office@thor.com');

            expect(tenant).not.null;
        });
    });
});