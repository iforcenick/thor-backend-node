import * as models from '../user/models';
import {AutoWired, Inject, Provides} from 'typescript-ioc';
import {Config} from '../config';
import * as crypto from '../crypto';
const jwt = require('jsonwebtoken');

export abstract class JWTDecryptor {
    abstract decryptPayload(payload: string);
}

export abstract class JWTTokenProvider {
    abstract generateJwt(user: models.User);
}

@AutoWired
@Provides(JWTDecryptor)
@Provides(JWTTokenProvider)
export class JWTEncryption implements JWTDecryptor, JWTTokenProvider {
    private _config: Config;

    constructor(@Inject config: Config) {
        this._config = config;
    }

    generateJwt(user: models.User) {
        const encryptedUser = crypto.aesCrypt(JSON.stringify(user.toJSON()), this._config.get('authorization.payloadSecret'));

        return jwt.sign({user: Buffer.from(encryptedUser, 'binary').toString('base64')}, this._config.get('authorization.jwtSecret'), {
             expiresIn: this._config.get('authorization.tokenExpirationTime'),
        });
    }

    decryptPayload(payload: any) {
        const userPayload = Buffer.from(payload.user, 'base64').toString('binary');
        payload.user = JSON.parse(crypto.aesDecrypt(userPayload, this._config.get('authorization.payloadSecret')));
        return payload;
    }
}