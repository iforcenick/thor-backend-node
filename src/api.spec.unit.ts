import {ServiceContext, Errors} from 'typescript-rest';
import * as b from './test-setup.spec.unit';
import {BaseController} from './api';
import {Types as RoleTypes} from './user/role/models';
import * as checks from './user/role/checks';

const expect = b.chai.expect;

describe('API base', async () => {
    describe('Roles checks', async () => {
        let serviceContext: ServiceContext;

        beforeEach(async () => {
            serviceContext = b.getMockedServiceContext();
        });

        it('should accept role', async () => {
            b.setAdminAuth(serviceContext);
            expect(BaseController._requireRole(serviceContext.request, RoleTypes.admin)).not.undefined;
        });

        it('should throw Forbidden for invalid role', async () => {
            b.setAnonymousAuth(serviceContext);
            expect(() => BaseController._requireRole(serviceContext.request, RoleTypes.admin)).to.throw(Errors.ForbiddenError);
        });

        it('should check for set role', async () => {
            b.setAdminAuth(serviceContext);
            expect(BaseController._checkRoles(serviceContext.request, checks.isAdminRole)).not.undefined;
        });

        it('should throw Forbidden during check for not set role', async () => {
            b.setContractorAuth(serviceContext);
            expect(() => BaseController._checkRoles(serviceContext.request, checks.isAdminRole)).to.throw(Errors.ForbiddenError);
        });

        it('should meet adminReader role check for admin auth', async () => {
            b.setAdminAuth(serviceContext);
            expect(BaseController.requireAdminReader(serviceContext.request)).not.undefined;
        });

        it('should meet adminReader role check for adminReader auth', async () => {
            b.setAdminReaderAuth(serviceContext);
            expect(BaseController.requireAdminReader(serviceContext.request)).not.undefined;
        });

        it('should not meet adminReader role check for anonymous auth', async () => {
            b.setAnonymousAuth(serviceContext);
            expect(() => BaseController.requireAdminReader(serviceContext.request)).to.throw(Errors.ForbiddenError);
        });

        it('should not meet adminReader role check for contractor auth', async () => {
            b.setContractorAuth(serviceContext);
            expect(() => BaseController.requireAdminReader(serviceContext.request)).to.throw(Errors.ForbiddenError);
        });

        it('should meet admin role check for admin auth', async () => {
            b.setAdminAuth(serviceContext);
            expect(BaseController.requireAdmin(serviceContext.request)).not.undefined;
        });

        it('should not meet admin role check for adminReader auth', async () => {
            b.setAdminReaderAuth(serviceContext);
            expect(() => BaseController.requireAdmin(serviceContext.request)).to.throw(Errors.ForbiddenError);
        });

        it('should not meet admin role check for anonymous auth', async () => {
            b.setAnonymousAuth(serviceContext);
            expect(() => BaseController.requireAdmin(serviceContext.request)).to.throw(Errors.ForbiddenError);
        });

        it('should not meet admin role check for contractor auth', async () => {
            b.setContractorAuth(serviceContext);
            expect(() => BaseController.requireAdmin(serviceContext.request)).to.throw(Errors.ForbiddenError);
        });

        it('should meet contractor role check for contractor auth', async () => {
            b.setContractorAuth(serviceContext);
            expect(BaseController.requireContractor(serviceContext.request)).not.undefined;
        });

        it('should not meet contractor role check for adminReader auth', async () => {
            b.setAdminReaderAuth(serviceContext);
            expect(() => BaseController.requireContractor(serviceContext.request)).to.throw(Errors.ForbiddenError);
        });

        it('should not meet contractor role check for anonymous auth', async () => {
            b.setAnonymousAuth(serviceContext);
            expect(() => BaseController.requireContractor(serviceContext.request)).to.throw(Errors.ForbiddenError);
        });

        it('should not meet contractor role check for admin auth', async () => {
            b.setAdminAuth(serviceContext);
            expect(() => BaseController.requireContractor(serviceContext.request)).to.throw(Errors.ForbiddenError);
        });
    });
});
