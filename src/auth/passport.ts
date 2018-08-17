const passport = require('passport');
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
import {UserService} from '../user/service';
import * as user from '../user/models';
import {Config} from '../config';
import {Container} from 'typescript-ioc';

const config = Container.get(Config);

passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.get('authorization.jwtSecret')
    },
    function (jwtPayload, cb) {
        // const service = Container.get(UserService);
        // service.get(jwtPayload.id).then((user) => {
        //     return cb(null, user);
        // });
        return cb(null, user.User.fromJson(jwtPayload));
    }
));

module.exports = passport;
