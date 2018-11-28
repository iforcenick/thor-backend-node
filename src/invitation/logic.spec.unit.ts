import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import 'mocha';
import {BatchInvitationsLogic} from './logic';

import {sandbox} from '../test-setup.spec.unit';
import {RequestContext} from '../context';
import {ServiceContext} from 'typescript-rest';
import {InvitationService} from './service';
import {Container} from 'typescript-ioc';
import {Invitation} from './models';
import * as models from './models';
import {TenantService} from '../tenant/service';
import {Tenant} from '../tenant/models';
import {MailerService} from '../mailer';
import {assert} from 'joi';
import {ProfileService} from '../profile/service';

chai.use(chaiAsPromised);
const expect = chai.expect;

let sut: BatchInvitationsLogic = undefined;

describe('InvitationLogic', () => {
    describe('Batch invitations stubs', () => {
        beforeEach(async () => {
            const requestContext = new RequestContext(undefined);
            sandbox.stub(requestContext, 'getTenantId').returns('7bc0447a-ea99-4ba2-93bb-c84f5b325c50');
            sut = new BatchInvitationsLogic(requestContext);

            const invitationServiceStub = Container.get(InvitationService);
            const array = new Array<Invitation>();
            sandbox.stub(invitationServiceStub, 'getByEmails').returns(Promise.resolve(array));
            sandbox.stub(invitationServiceStub, 'getByExternalIds').returns(Promise.resolve(array));
            sandbox.stub(invitationServiceStub, 'insert').returns(Promise.resolve(array));
            sut.invitations = invitationServiceStub;

            const profileServiceStub = Container.get(ProfileService);
            sandbox.stub(profileServiceStub, 'getByEmails').returns(Promise.resolve(array));
            sandbox.stub(profileServiceStub, 'getByExternalIds').returns(Promise.resolve(array));
            sut.profiles = profileServiceStub;

            const tenantServiceStub = Container.get(TenantService);
            sandbox.stub(tenantServiceStub, 'get').returns(Tenant.factory({businessName: 'Thor LTD'}));
            sut.tenants = tenantServiceStub;

            const mailerServiceStub = Container.get(MailerService);
            sandbox.stub(mailerServiceStub, 'sendInvitation').returns(Promise.resolve(true));
            sut.mailer = mailerServiceStub;
        });
        it('with external id should send emails for all email addresses in file', async () => {
            const csv = 'email;externalId\n' +
                'test00@test.com;e2c84d30-0e13-483b-9b42-3b4d9a1dfa90\n' +
                'test01@test.com;f5d5a8f3-ad6b-4b2c-9912-0db49f860dc6';
            const buffer = Buffer.from(csv, 'utf-8');
            const invitations = await sut.execute(buffer);
            expect(invitations).not.empty;
            expect(invitations.length).equals(2);
        });
        it('with inconsistent columns should send emails for all email addresses in file', async () => {
            const csv = 'email;externalId\n' +
                'test00@test.com;e2c84d30-0e13-483b-9b42-3b4d9a1dfa90\n' +
                'test01@test.com';
            const buffer = Buffer.from(csv, 'utf-8');
            const invitations = await sut.execute(buffer);
            expect(invitations).not.empty;
            expect(invitations.length).equals(2);
        });
        it('without external id should send emails for all email addresses in file', async () => {
            const csv = 'email;externalId\n' +
                'test00@test.com\n' +
                'test01@test.com';
            const buffer = Buffer.from(csv, 'utf-8');
            const invitations = await sut.execute(buffer);
            expect(invitations).not.empty;
            expect(invitations.length).equals(2);
        });
        it('on incorrect email in file should import validate emails', async () => {
            const csv = 'email;externalId\n' +
                'test00@test.com\n' +
                'test01';
            const buffer = Buffer.from(csv, 'utf-8');
            const invitations = await sut.execute(buffer);
            expect(invitations.length).equals(1);
        });
    });
});
