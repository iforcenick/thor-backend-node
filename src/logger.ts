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
    winston: Winston.Logger;
    expressWinston: any;

    constructor() {
        this.winston = this.instantiateLogger();
        this.expressWinston = this.instantiateLoggerMiddleware();
    }

    private getOptions(): Winston.LoggerOptions {
        this.level = LogLevel[this.config.get('logs.level')];

        const options: Winston.LoggerOptions = {
            exitOnError: false,
            format: Winston.format.combine(
                Winston.format.timestamp(),
                Winston.format.json(),
            ),
            transports: [new Winston.transports.Console()]
        };

        if (this.config.get('logs.silent')) {
            options.silent = true;
        }

        return options;
    }

    private instantiateLogger() {
        const options = this.getOptions();
        options.level = LogLevel[this.level];
        return Winston.createLogger(options);
    }

    private instantiateLoggerMiddleware() {
        const options: any = this.getOptions();
        options.meta = false;
        options.msg = 'HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}} | {{req.connection.remoteAddress}}';

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
