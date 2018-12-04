import {DecodeJwtLogic} from './logic';

const passport = require('passport');

passport.use(new DecodeJwtLogic().execute());

module.exports = passport;
