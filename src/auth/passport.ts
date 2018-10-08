import {JWTEncryption} from './encryption';

const passport = require('passport');
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
import {UserService} from '../user/service';
import {Config} from '../config';
import {Container} from 'typescript-ioc';

const config = Container.get(Config);

passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.get('authorization.jwtSecret')
    },
    function (jwtPayload, cb) {
        const jwtDecryptor = Container.get(JWTEncryption);
        const payload = jwtDecryptor.decryptPayload(jwtPayload);
        const service = Container.get(UserService);
        service.setTenantId(payload.user.tenantProfile.tenantId);
        service.get(payload.user.id).then((user) => {
            return cb(null, user);
        });
    }
));

module.exports = passport;
