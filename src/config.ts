import {AutoWired, Singleton} from 'typescript-ioc';

@Singleton
@AutoWired
export class Config {
    config: any;

    constructor() {
        this.config = require('config');
    }

    private env_key(key) {
        return key.replace(/\./g, '_');
    }

    get(key) {
        if (process.env[this.env_key(key)]) {
            return process.env[this.env_key(key)];
        }

        return this.config.get(key);
    }

    has(key) {
        if (process.env[this.env_key(key)]) {
            return true;
        }

        return this.config.has(key);
    }

    static isDev() {
        return process.env['NODE_ENV'].startsWith('development');
    }

    static isSandbox() {
        return process.env['NODE_ENV'].startsWith('development-kubernetes-sand');
    }
}
