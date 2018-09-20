import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import {Container} from 'typescript-ioc';
import * as mailer from './index';
import * as client from './client';
import * as users from '../user/models';
import * as profiles from '../profile/models';
import * as tenants from '../tenant/models';
import 'mocha';
import {sandbox} from '../test-setup.spec.unit';

chai.use(chaiAsPromised);
const expect = chai.expect;

const service: mailer.MailerService = Container.get(mailer.MailerService);
const mailgunClient: mailer.Mailgun = Container.get(mailer.Mailgun);

describe('Mailer service', () => {
    describe('creation', () => {
        it('should have Mailgun client', async () => {
            expect((service as any).client).to.be.an.instanceof(mailer.Mailgun);
        });
    });

    describe('send', () => {
        it('should return true', async () => {
            const client = (service as any).client;
            sandbox.stub(client, 'send').returns(Promise.resolve(true));
            expect(await service.send('', '', '', '', '')).to.be.true;
        });
    });

    describe('sendTemplate', () => {
        it('should return true', async () => {
            const client = (service as any).client;
            sandbox.stub(client, 'send').returns(Promise.resolve(true));
            const sendSpy = sandbox.spy(service, 'send');
            const user = new users.User();
            const profile = new profiles.Profile();
            const email = 'test@test.com';
            profile.email = email;
            profile.tenantId = 'test';
            user.profiles = [profile];
            const tenant = new tenants.Tenant();
            const template = new mailer.Template();
            sandbox.stub(template, 'readTemplateFile').returns('test {{ test }}');
            const subject = 'test subject';
            const params = {test: 'test'};
            template.setSubject(subject).setParams(params).setHtml('.twig').setText('.twig');
            expect(await service.sendTemplate(user, template)).to.be.true;
            expect(sendSpy.calledOnce).to.be.true;
            expect(sendSpy.getCall(0).args[0]).to.equal(email);
            expect(sendSpy.getCall(0).args[2]).to.equal(subject);
            expect(sendSpy.getCall(0).args[3]).to.equal('test test');
            expect(sendSpy.getCall(0).args[4]).to.equal('test test');
        });
    });
});

describe('Mailer Mailgun client', () => {
    describe('send', () => {
        it('should return true if API accepted post', async () => {
            sandbox.stub(mailgunClient, '_send').callsArgWith(1, null, {});
            const response = await mailgunClient.send('t', 't', 't', 't', 't');
            expect(response).to.be.true;
        });

        it('should throw MailerClientError if post failed', async () => {
            sandbox.stub(mailgunClient, '_send').callsArgWith(1, new Error(), {});
            await expect(mailgunClient.send('pawel@gothor.com', 'test@gothor.com', 't', 't', 't')).to.be.rejectedWith(client.MailerClientError);
        });
    });
});

describe('Mailer Templates', () => {
    describe('create', () => {
        it('should set subject', async () => {
            const subject = 'test subject';
            const template = new mailer.Template();
            template.setSubject(subject);
            expect(await template.getSubject()).to.equal(subject);
        });

        it('should throw MissingTemplateFileException for non existing template file', async () => {
            // stubing fs doesn't work :(
            const template = new mailer.Template();
            expect(() => template.setHtml('missingTestTemplate.twig')).to.throw(mailer.MissingTemplateFileException);
            expect(() => template.setText('missingTestTemplate.twig')).to.throw(mailer.MissingTemplateFileException);
        });

        it('should set params', async () => {
            const params = {test: 'test'};
            const template = new mailer.Template();
            template.setParams(params);
            expect(template.getParams()).to.deep.equal(params);
        });

        it('should render html', async () => {
            const template = new mailer.Template();
            sandbox.stub(template, 'readTemplateFile').returns('test {{ test }}');
            template.setParams({test: 'test'}).setHtml('.twig');
            const response = await template.getHtml();
            expect(response).to.equal('test test');
        });

        it('should render text', async () => {
            const template = new mailer.Template();
            sandbox.stub(template, 'readTemplateFile').returns('test {{ test }}');
            template.setParams({test: 'test'}).setText('.twig');
            const response = await template.getText();
            expect(response).to.equal('test test');
        });
    });
});