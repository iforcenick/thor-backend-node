import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import 'mocha';

const {mockRequest} = require('mock-req-res');
import * as _ from 'lodash';
import {RequestContext, RequestContextMissingUserError} from './context';
import {ServiceContext} from 'typescript-rest';
import {Auth, AuthType} from './auth/models';
import {Types} from './user/role/models';

chai.use(chaiAsPromised);
const expect = chai.expect;
const contractorTenantId = '7bc0447a-ea99-4ba2-93bb-c84f5b325c50';
const contractorId = '8251efb9-18b5-476e-a2a0-27e38a4da750';
const adminTenantId = '7bc0447a-ea99-4ba2-93bb-c84f5b325c50';
const adminId = '7f11b5b2-c9f8-4e3f-920d-0248daaa216e';

const setAnonymousAuth = (serviceContext) => {
    serviceContext.request.auth = new Auth();
};

const setContractorAuth = (serviceContext) => {
    const auth = new Auth();
    auth.type = AuthType.TENANT;
    auth.userId = contractorId;
    auth.tenantId = contractorTenantId;
    auth.roles = [Types.contractor];
    serviceContext.request.auth = auth;
};

const setAdminAuth = (serviceContext) => {
    const auth = new Auth();
    auth.type = AuthType.TENANT;
    auth.userId = adminId;
    auth.tenantId = adminTenantId;
    auth.roles = [Types.admin];
    serviceContext.request.auth = auth;
};

describe('Context', async () => {
    describe('RequestContext', async () => {
        let serviceContext: ServiceContext;

        beforeEach(async () => {
            serviceContext = new ServiceContext();
            serviceContext.request = mockRequest();
        });

        it('should override tenant id', async () => {
            setAnonymousAuth(serviceContext);
            const context = new RequestContext(serviceContext);
            expect(context.getTenantId()).to.equal(null);
            const tenantId = 'testTenantId';
            context.setForceTenantId(tenantId);
            expect(context.getTenantId()).to.equal(tenantId);
        });

        describe('Anonymous auth', async () => {
            beforeEach(async () => {
                setAnonymousAuth(serviceContext);
            });

            it('should create', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().type).to.equal(AuthType.ANONYMOUS);
            });

            it('should throw exception when getting user id', async () => {
                const context = new RequestContext(serviceContext);
                expect(() => {
                    context.getUserId();
                }).to.throw(RequestContextMissingUserError);
            });
        });

        describe('Contractor auth', async () => {
            beforeEach(async () => {
                setContractorAuth(serviceContext);
            });

            it('should create', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().type).to.equal(AuthType.TENANT);
            });

            it('should return user id', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getUserId()).to.equal(contractorId);
            });

            it('should return tenant id', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getTenantId()).to.equal(contractorTenantId);
            });

            it('should have contractor role', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().hasRole(Types.contractor)).to.be.true;
            });
        });

        describe('Admin auth', async () => {
            beforeEach(async () => {
                setAdminAuth(serviceContext);
            });

            it('should create', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().type).to.equal(AuthType.TENANT);
            });

            it('should return user id', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getUserId()).to.equal(adminId);
            });

            it('should return tenant id', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getTenantId()).to.equal(adminTenantId);
            });

            it('should have admin role', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().hasRole(Types.admin)).to.be.true;
            });
        });
    });
});
