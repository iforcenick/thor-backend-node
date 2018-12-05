import {Auth, AuthType} from '../../auth/models';
import {Types} from '../../user/role/models';
import {Config} from '../../config';
import {Container} from 'typescript-ioc';
const jwt = require('jsonwebtoken');

const config: Config = Container.get(Config);

const auth = new Auth();
auth.type = AuthType.SYSTEM;
auth.userId = '8251efb9-18b5-476e-a2a0-27e38a4da750';
auth.tenantId = '7bc0447a-ea99-4ba2-93bb-c84f5b325c50';
// auth.tenantId = '8e1be740-2152-467b-9c9b-be6dac16e9e1';
auth.roles = [Types.admin];

const token = jwt.sign(auth.toJwt(), config.get('authorization.jwtSecret'), {
    expiresIn: config.get('authorization.tokenExpirationTime'),
});

console.log(token);