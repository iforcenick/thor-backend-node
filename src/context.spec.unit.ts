import {RequestContext, RequestContextMissingUserError} from './context';
import {ServiceContext} from 'typescript-rest';
import {AuthType} from './auth/models';
import {Types} from './user/role/models';
import * as b from './test-setup.spec.unit';

const expect = b.chai.expect;


describe('Context', async () => {
    describe('RequestContext', async () => {
        let serviceContext: ServiceContext;

        beforeEach(async () => {
            serviceContext = b.getMockedServiceContext();
        });

        it('should override tenant id', async () => {
            b.setAnonymousAuth(serviceContext);
            const context = new RequestContext(serviceContext);
            expect(context.getTenantId()).to.equal(null);
            const tenantId = 'testTenantId';
            context.setTenantIdOverride(tenantId);
            expect(context.getTenantId()).to.equal(tenantId);
        });

        describe('Anonymous auth', async () => {
            beforeEach(async () => {
                b.setAnonymousAuth(serviceContext);
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

            it('should not return tenant id from X-Tenant-Claim header', async () => {
                const tenantIdClaim = 'test';
                const context = new RequestContext(serviceContext);
                b.sinon.stub(context, 'getHeader').returns(tenantIdClaim);
                expect(context.getTenantId()).to.equal(null);
            });

            it('should not override X-Tenant-Claim header', async () => {
                const tenantIdClaim = 'test2';
                const context = new RequestContext(serviceContext);
                b.sinon.stub(context, 'getHeader').returns('test');
                context.setTenantIdClaimOverride(tenantIdClaim);
                expect(context.getTenantId()).to.equal(null);
            });
        });

        describe('Contractor auth', async () => {
            beforeEach(async () => {
                b.setContractorAuth(serviceContext);
            });

            it('should create', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().type).to.equal(AuthType.TENANT);
            });

            it('should return user id', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getUserId()).to.equal(b.contractorId);
            });

            it('should return tenant id', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getTenantId()).to.equal(b.contractorTenantId);
            });

            it('should have contractor role', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().hasRole(Types.contractor)).to.be.true;
            });

            it('should not return tenant id from X-Tenant-Claim header', async () => {
                const tenantIdClaim = 'test';
                const context = new RequestContext(serviceContext);
                b.sinon.stub(context, 'getHeader').returns(tenantIdClaim);
                expect(context.getTenantId()).to.equal(b.contractorTenantId);
            });

            it('should not override X-Tenant-Claim header', async () => {
                const tenantIdClaim = 'test2';
                const context = new RequestContext(serviceContext);
                b.sinon.stub(context, 'getHeader').returns('test');
                context.setTenantIdClaimOverride(tenantIdClaim);
                expect(context.getTenantId()).to.equal(b.contractorTenantId);
            });
        });

        describe('Admin auth', async () => {
            beforeEach(async () => {
                b.setAdminAuth(serviceContext);
            });

            it('should create', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().type).to.equal(AuthType.TENANT);
            });

            it('should return user id', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getUserId()).to.equal(b.adminId);
            });

            it('should return tenant id', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getTenantId()).to.equal(b.adminTenantId);
            });

            it('should have admin role', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().hasRole(Types.admin)).to.be.true;
            });

            it('should not return tenant id from X-Tenant-Claim header', async () => {
                const tenantIdClaim = 'test';
                const context = new RequestContext(serviceContext);
                b.sinon.stub(context, 'getHeader').returns(tenantIdClaim);
                expect(context.getTenantId()).to.equal(b.adminTenantId);
            });

            it('should not override X-Tenant-Claim header', async () => {
                const tenantIdClaim = 'test2';
                const context = new RequestContext(serviceContext);
                b.sinon.stub(context, 'getHeader').returns('test');
                context.setTenantIdClaimOverride(tenantIdClaim);
                expect(context.getTenantId()).to.equal(b.adminTenantId);
            });
        });

        describe('System auth', async () => {
            beforeEach(async () => {
                b.setSystemAuth(serviceContext);
            });

            it('should create', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().type).to.equal(AuthType.SYSTEM);
            });

            it('should return user id', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getUserId()).to.equal(b.systemId);
            });

            it('should return tenant id', async () => {
                const context = new RequestContext(serviceContext);
                b.sinon.stub(context, 'getHeader').returns(undefined);
                expect(context.getTenantId()).to.equal(b.systemTenantId);
            });

            it('should have admin role', async () => {
                const context = new RequestContext(serviceContext);
                expect(context.getAuth().hasRole(Types.admin)).to.be.true;
            });

            it('should return tenant id from X-Tenant-Claim header', async () => {
                const tenantIdClaim = '7bc0447a-ea99-4ba2-93bb-c84f5b325c50';
                const context = new RequestContext(serviceContext);
                b.sinon.stub(context, 'getHeader').returns(tenantIdClaim);
                expect(context.getTenantId()).to.equal(tenantIdClaim);
            });

            it('should override X-Tenant-Claim header', async () => {
                const tenantIdClaim = '7bc0447a-ea99-4ba2-93bb-c84f5b325c50';
                const context = new RequestContext(serviceContext);
                b.sinon.stub(context, 'getHeader').returns('test');
                context.setTenantIdClaimOverride(tenantIdClaim);
                expect(context.getTenantId()).to.equal(tenantIdClaim);
            });
        });
    });
});
