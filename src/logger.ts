import * as Winston from 'winston';
import * as expressWinston from 'express-winston';
import {AutoWired, Inject} from 'typescript-ioc';
import {inspect} from 'util';
import {Config} from './config';
import * as _ from 'lodash';

const MESSAGE = Symbol.for('message');

export enum LogLevel {
    error, warn, info, debug
}

expressWinston.bodyBlacklist.push('headers');

const defaultOptions = (config: Config, requestId?: string) => {
    const options: any = {
        exitOnError: false,
        format: Winston.format.combine(
            Winston.format.timestamp(),
            Winston.format.json(),
            Winston.format(message => {
                if (!requestId) {
                    return message;
                }

                message.message = `[ReqID: ${requestId}] ` + message.message;
                const index: any = MESSAGE;
                message[index] = JSON.stringify(message);
                return message;
            })(),
        ),
        transports: [new Winston.transports.Console()],
    };
    options.meta = config.get('logs.node.meta');
    options.requestFilter = (req, propName) => {
        if (propName == 'headers') {
            delete req[propName]['authorization'];
        }

        return req[propName];
    };

    return options;
};

export class ExpressLogger {
    @Inject private config: Config;
    level: any;

    private options() {
        return defaultOptions(this.config);
    }

    public middleware() {
        const options = this.options();
        options.msg = `[ReqID: {{req.requestId}}] `;
        options.msg += 'HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}} | {{req.connection.remoteAddress}}';

        return expressWinston.logger(options);
    }

    public errorMiddleware() {
        const options = this.options();
        options.msg = `[ReqID: {{req.requestId}}] MiddlewareReport`;

        return expressWinston.errorLogger(options);
    }
}

@AutoWired
export class Logger {
    @Inject private config: Config;
    level: any;
    winston: Winston.Logger;
    protected correlationId: string;
    protected requestId: string;

    constructor() {
        this.requestId = 'N/I';
        this.correlationId = 'N/I';
        this.winston = this.instantiateLogger();
    }

    private getOptions(): Winston.LoggerOptions {
        this.level = LogLevel[this.config.get('logs.level')];

        const options = defaultOptions(this.config, this.requestId);

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

    private parseParams(args) {
        if (args.length) {
            const first = args[0];
            if (_.isObject(first)) {
                args[0] = JSON.stringify(first);
                args.push({__loggedObject: first});
            }
        }

        return args;
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
        this.winston.debug.apply(this, this.parseParams(args));
    }

    info(...args: any[]) {
        this.winston.info.apply(this, this.parseParams(args));
    }

    warn(...args: any[]) {
        this.winston.warn.apply(this, this.parseParams(args));
    }

    error(...args: any[]) {
        this.winston.error.apply(this, this.parseParams(args));
    }

    inspectObject(object: any) {
        inspect(object, {colors: true, depth: 15});
    }
}
