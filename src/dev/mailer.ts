import * as mailer from '../mailer';
import * as users from '../user/models';
import * as profiles from '../profile/models';
import {Container} from 'typescript-ioc';

const service: mailer.MailerService = Container.get(mailer.MailerService);
const user = new users.User();
const profile = new profiles.Profile();
profile.email = 'pawel@gothor.com';
profile.tenantId = 'test';
user.profiles = [profile];
const template = new mailer.Template();
const params = {name: 'Tester Pawel', link: 'gothor-api.gothor.com'};
template.setSubject('test email').setHtml(mailer.TemplatesFiles.SUMMARY_HTML).setText(mailer.TemplatesFiles.SUMMARY_TEXT).setParams(params);

service.sendTemplate(user, template).then(r => {
    console.log('result', r);
}).catch(e => {
    console.log(e);
});