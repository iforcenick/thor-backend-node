import crypto = require('crypto');
import {Utf8AsciiBinaryEncoding} from 'crypto';

export const aesCrypt = (content, password, encoding: Utf8AsciiBinaryEncoding = 'utf8') => {
    const iv = crypto.pseudoRandomBytes(16);
    const hash = crypto.createHash('sha256');
    hash.update(password);
    const hPassword = hash.digest();
    const c = crypto.createCipheriv('aes-256-cbc', hPassword, iv);
    const crypted = c.update(content, encoding, 'binary') + c.final('binary');
    return iv.toString('binary') + crypted;
};

export const aesDecrypt = (content, password, encoding: Utf8AsciiBinaryEncoding = 'utf8') => {
    const iv = Buffer.from(content.slice(0, 16), 'binary');
    const crypted = content.slice(16);
    const hash = crypto.createHash('sha256');
    hash.update(password);
    const hPassword = hash.digest();
    const d = crypto.createDecipheriv('aes-256-cbc', hPassword, iv);
    return d.update(crypted, 'binary', encoding) + d.final(encoding);
};