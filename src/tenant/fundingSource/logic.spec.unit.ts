import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import 'mocha';
import {RequestContext} from '../../context';
import {sandbox} from '../../test-setup.spec.unit';
import {Container} from 'typescript-ioc';
import {AddVerifyingFundingSourceForTenantLogic} from './logic';
import {FundingSourceService} from '../../fundingSource/services';
import {TenantService} from '../service';
import {Tenant} from '../models';
import * as dwolla from '../../dwolla';
import {Source} from '../../dwolla/funding';
import {User} from '../../user/models';
import {Auth, AuthType} from '../../auth/models';
import {Types} from '../../user/role/models';
import {ServiceContext} from 'typescript-rest';
import {MailerService} from '../../mailer';
import {Profile} from '../../profile/models';
import {NotAcceptableError, NotFoundError} from 'typescript-rest/dist/server-errors';
import {ValidationError} from '../../errors';
import {DwollaRequestError} from '../../dwolla';

chai.use(chaiAsPromised);
const expect = chai.expect;

let sut: AddVerifyingFundingSourceForTenantLogic = undefined;
const {mockRequest} = require('mock-req-res');

const adminTenantId = '7bc0447a-ea99-4ba2-93bb-c84f5b325c50';
const adminId = '7f11b5b2-c9f8-4e3f-920d-0248daaa216e';
const setAdminAuth = (serviceContext) => {
    const auth = new Auth();
    auth.type = AuthType.TENANT;
    auth.userId = adminId;
    auth.tenantId = adminTenantId;
    auth.roles = [Types.admin];
    serviceContext.request.auth = auth;
};

describe('AddVerifyingFundingSourceForTenantLogic', () => {
    describe('data is consistent in dwolla and db', () => {
        beforeEach(async () => {
            const serviceContext = new ServiceContext();
            serviceContext.request = mockRequest();
            setAdminAuth(serviceContext);
            const requestContext = new RequestContext(serviceContext);
            sandbox.stub(requestContext, 'getUserId').returns(adminId);
            sandbox.stub(requestContext, 'getTenantId').returns(adminTenantId);
            sut = new AddVerifyingFundingSourceForTenantLogic(requestContext);

            const fundingSourceServiceStub = Container.get(FundingSourceService);
            sandbox.stub(fundingSourceServiceStub, 'getByPaymentsUri').returns(undefined);
            sut.fundingService = fundingSourceServiceStub;

            const tenantServiceStub = Container.get(TenantService);
            const tenant = Tenant.factory({});
            sandbox.stub(tenantServiceStub, 'get').returns(tenant);
            sandbox.stub(tenantServiceStub, 'update').returns(tenant);
            sut.tenantService = tenantServiceStub;


            const sourceStub = new Source({
                name: 'test account',
                _links: [
                    'initiate-micro-deposits',
                    'verify-micro-deposits'
                ]
            });
            sandbox.stub(sourceStub, 'verificationStatus').returns('completed');

            const clientStub = Container.get(dwolla.Client);
            sandbox.stub(clientStub, 'getFundingSource').returns(Promise.resolve(sourceStub));
            sut.client = clientStub;

            const mailerStub = Container.get(MailerService);
            sandbox.stub(mailerStub, 'sendFundingSourceAdded').returns(Promise.resolve());
            sut.mailer = mailerStub;

        });
        it('should be return funding source with complete status', async () => {
            const tenantProfile = Profile.factory({tenantId: ''});
            const user: User = new User();
            user.tenantProfile = tenantProfile;
            const tenant = await sut.execute(user, 'https://dwolla.com/');

            expect(tenant).not.null;
            expect(tenant.fundingSourceUri).equals('https://dwolla.com/', 'uri is different');
            expect(tenant.fundingSourceName).equals('test account', 'name is different');
            expect(tenant.fundingSourceStatus).equals('completed', 'status is different');
        });
        it('should thrown error - uri is empty', async () => {
            const tenantProfile = Profile.factory({tenantId: ''});
            const user: User = new User();
            user.tenantProfile = tenantProfile;
            await expect(sut.execute(user, '')).to.be.rejectedWith(NotAcceptableError);

        });
    });
    describe('on exisiting funding source in thor db', () => {
        beforeEach(async () => {
            const serviceContext = new ServiceContext();
            serviceContext.request = mockRequest();
            setAdminAuth(serviceContext);
            const requestContext = new RequestContext(serviceContext);
            sandbox.stub(requestContext, 'getUserId').returns(adminId);
            sandbox.stub(requestContext, 'getTenantId').returns(adminTenantId);
            sut = new AddVerifyingFundingSourceForTenantLogic(requestContext);

            const fundingSourceServiceStub = Container.get(FundingSourceService);
            sandbox.stub(fundingSourceServiceStub, 'getByPaymentsUri').returns(undefined);
            sut.fundingService = fundingSourceServiceStub;

            const tenantServiceStub = Container.get(TenantService);
            const tenant = Tenant.factory({
                fundingSourceUri: 'http://dwolla.com'
            });
            sandbox.stub(tenantServiceStub, 'get').returns(tenant);
            sandbox.stub(tenantServiceStub, 'update').returns(tenant);
            sut.tenantService = tenantServiceStub;


            const sourceStub = new Source({
                name: 'test account',
                _links: [
                    'initiate-micro-deposits',
                    'verify-micro-deposits'
                ]
            });
            sandbox.stub(sourceStub, 'verificationStatus').returns('completed');

            const clientStub = Container.get(dwolla.Client);
            sandbox.stub(clientStub, 'getFundingSource').returns(Promise.resolve(sourceStub));
            sut.client = clientStub;

            const mailerStub = Container.get(MailerService);
            sandbox.stub(mailerStub, 'sendFundingSourceAdded').returns(Promise.resolve());
            sut.mailer = mailerStub;
        });
        it('should thrown error - Could not add more funding sources', async () => {
            const tenantProfile = Profile.factory({tenantId: ''});
            const user: User = new User();
            user.tenantProfile = tenantProfile;
            await expect(sut.execute(user, 'http://dwolla.com')).to.be.rejectedWith(NotAcceptableError);
        });
    });
    describe('on dwolla exception', () => {
        beforeEach(async () => {
            const serviceContext = new ServiceContext();
            serviceContext.request = mockRequest();
            setAdminAuth(serviceContext);
            const requestContext = new RequestContext(serviceContext);
            sandbox.stub(requestContext, 'getUserId').returns(adminId);
            sandbox.stub(requestContext, 'getTenantId').returns(adminTenantId);
            sut = new AddVerifyingFundingSourceForTenantLogic(requestContext);

            const fundingSourceServiceStub = Container.get(FundingSourceService);
            sandbox.stub(fundingSourceServiceStub, 'getByPaymentsUri').returns(undefined);
            sut.fundingService = fundingSourceServiceStub;

            const tenantServiceStub = Container.get(TenantService);
            const tenant = Tenant.factory({
            });
            sandbox.stub(tenantServiceStub, 'get').returns(tenant);
            sandbox.stub(tenantServiceStub, 'update').returns(tenant);
            sut.tenantService = tenantServiceStub;


            const sourceStub = new Source({
                name: 'test account',
                _links: [
                    'initiate-micro-deposits',
                    'verify-micro-deposits'
                ]
            });
            sandbox.stub(sourceStub, 'verificationStatus').returns('completed');

            const clientStub = Container.get(dwolla.Client);

            const error = new DwollaRequestError();
            const parsedErrors = [];
            parsedErrors.push({
                message: '',
                path: 'path',
                type: `external`,
                context: {value: '', key: 'field', label: 'field'}
            });
            const validationError = new ValidationError({details: parsedErrors});
            sandbox.stub(error, 'toValidationError').returns(validationError);
            sandbox.stub(clientStub, 'getFundingSource').throws(error);
            sut.client = clientStub;

            const mailerStub = Container.get(MailerService);
            sandbox.stub(mailerStub, 'sendFundingSourceAdded').returns(Promise.resolve());
            sut.mailer = mailerStub;
        });
        it('should throw NotFoundError', async () => {
            const tenantProfile = Profile.factory({tenantId: ''});
            const user: User = new User();
            user.tenantProfile = tenantProfile;
            await expect(sut.execute(user, 'http://dwolla.com')).to.be.rejectedWith(NotFoundError);
        });
    });
});
