import * as Winston from 'winston';
import * as expressWinston from 'express-winston';
import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import {inspect} from 'util';
import {Config} from './config';

export enum LogLevel {
    error, warn, info, debug
}

@Singleton
@AutoWired
export class Logger {
    @Inject private config: Config;
    level: any;
    winston: Winston.LoggerInstance;
    expressWinston: Winston.LoggerInstance;

    constructor() {
        this.winston = this.instantiateLogger();
        this.expressWinston = this.instantiateLoggerMiddleware();
    }

    private instantiateLogger() {
        this.level = LogLevel[this.config.get('logs.level')];
        const options: Winston.LoggerOptions = {
            level: LogLevel[this.level],
            transports: [
                new Winston.transports.Console({colorize: this.config.get('logs.colorize')}),
                new Winston.transports.File({filename: this.config.get('logs.filename')}),
            ]
        };

        return new Winston.Logger(options);
    }

    private instantiateLoggerMiddleware() {
        const options: Winston.LoggerOptions = {
            transports: [
                new Winston.transports.File({filename: this.config.get('logs.filename')}),
            ],
            meta: false,
            msg: 'HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}'
        };

        return expressWinston.logger(options);
    }

    isDebugEnabled(): boolean {
        return this.level === LogLevel.debug;
    }

    isInfoEnabled(): boolean {
        return this.level >= LogLevel.info;
    }

    isWarnEnabled(): boolean {
        return this.level >= LogLevel.warn;
    }

    isErrorEnabled(): boolean {
        return this.level >= LogLevel.error;
    }

    debug(...args: any[]) {
        this.winston.debug.apply(this, arguments);
    }

    info(...args: any[]) {
        this.winston.info.apply(this, arguments);
    }

    warn(...args: any[]) {
        this.winston.warn.apply(this, arguments);
    }

    error(...args: any[]) {
        this.winston.error.apply(this, arguments);
    }

    inspectObject(object: any) {
        inspect(object, {colors: true, depth: 15});
    }
}
