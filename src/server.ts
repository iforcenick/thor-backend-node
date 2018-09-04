import {Server} from 'typescript-rest';
import {Config} from './config';
import {Logger} from './logger';
import {Inject} from 'typescript-ioc';
import {AuthController} from './auth/controller';
import {UserController} from './user/controller';
import {Model} from 'objection';
import {TenantController} from './tenant/controller';
import {ProfileController} from './profile/controller';
import express = require('express');
import {TransactionController} from './transaction/controller';
import {JobController} from './job/controller';
import * as dwolla from './dwolla';
import {DwollaController} from './dwolla/controller';

const knex = require('knex');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const passport = require('./auth/passport');
const createNamespace = require('continuation-local-storage').createNamespace;

export class ApiServer {
    @Inject private config: Config;
    @Inject private logger: Logger;
    @Inject private dwollaClient: dwolla.Client;
    private app: express.Application;
    private server: any = null;
    private port: number;
    private knex: any;
    static db: any;
    constructor() {
        this.port = this.config.get('express.port');
        this.app = express();
        this.setupDB();

        if (Config.isDev()) {
            this.app.use(morgan('dev'));
        }

        this.app.use(express.static(path.join(__dirname, 'public'), {maxAge: 31557600000}));
        this.app.use(cors());
        this.app.use(passport.initialize());
        this.app.use(bodyParser.json({limit: '25mb'}));
        this.app.use(methodOverride());

        this.addAuthorization();

        this.app.use(ApiServer.tokenExtractor);
        this.app.use(ApiServer.tenantExtractor);

        this.app.use(this.logger.expressWinston);

        this.addControllers();
        Server.swagger(this.app, './dist/swagger.json', '/api-docs', 'localhost:' + this.port, ['http']);

        this.app.use(this.errorHandler.bind(this));
    }

    private static tokenExtractor(req, res, next): void {
        const header = req.header('Authorization');

        if (header) {
            req.userToken = header.replace('Bearer ', '');
        }

        next();
    }

    private static tenantExtractor(req, res, next): void {
        const authContext = createNamespace('authContext');

        authContext.run(() => {
            if (req.user) {
                authContext.set('tenant', req.user.tenantProfile.tenantId);
                authContext.set('user', req.user);
            }

            next();
        });
    }

    /**
     * Start the server
     * @returns {Promise<any>}
     */
    public start(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.server = this.app.listen(this.port, async (err: any) => {
                if (err) {
                    return reject(err);
                }

                this.logger.info(`Listening to http://${this.server.address().address}:${this.server.address().port}`);
                await this.dwollaClient.authorize();
                const res = await this.dwollaClient.listWebhookEndpoints();
                const unsubscribe = [];
                const endpointUrl = 'http://35.230.69.244/dwolla';
                const subscriptions = res.body._embedded['webhook-subscriptions'];
                console.log('subscriptions count:', subscriptions.length);
                let hasSubscription = false;
                subscriptions.forEach(s => {
                    if (s.url !== endpointUrl) {
                        unsubscribe.push(this.dwollaClient.deleteWebhookEndpoint(s['_links'].self.href));
                    } else {
                        hasSubscription = true;
                    }
                });
                if (unsubscribe.length > 0) {
                    console.log('unsubscribe call with num: ', unsubscribe.length);
                    const resp = await Promise.all(unsubscribe);
                    console.log('unsub resp', resp);
                }
                if (!hasSubscription) {
                    console.log('register new sub');
                    const registerRes = await this.dwollaClient.registerWebhookEndpoint(endpointUrl);
                    console.log('registerRes', registerRes);
                }
                return resolve();
            });
        });
    }

    /**
     * Stop the server (if running).
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.server) {
                this.server.close(() => {
                    return resolve(true);
                });
            } else {
                return resolve(true);
            }
        });
    }

    public startTest() {
        this.server = this.app.listen(this.port);
        return this.server;
    }

    private setupDB() {
        this.knex = knex(this.config.get('db'));
        this.knex.migrate.latest();
        ApiServer.db = this.knex;
        Model.knex(this.knex);
    }

    private addAuthorization() {
        this.app.use('/users', passport.authenticate('jwt', {session: false}));
        this.app.use('/jobs', passport.authenticate('jwt', {session: false}));
        this.app.use('/transactions', passport.authenticate('jwt', {session: false}));
        this.app.use('/tenants', passport.authenticate('jwt', {session: false}));
        this.app.use('/auth/password', passport.authenticate('jwt', {session: false}));
    }

    private addControllers() {
        Server.buildServices(
            this.app,
            AuthController,
            UserController,
            TenantController,
            ProfileController,
            JobController,
            TransactionController,
            DwollaController,
        );
    }

    private errorHandler(err, req, res, next): void {
        this.logger.error(err);

        if (res.headersSent) {
            // important to allow default error handler to close connection if headers already sent
            return next(err);
        }

        const code = err.statusCode ? err.statusCode : 500;

        res.set('Content-Type', 'application/json');
        res.status(code);
        res.json({error: err.message, code: code});
    }
}
