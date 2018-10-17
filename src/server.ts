import {Server} from 'typescript-rest';
import {Config} from './config';
import {Logger, ExpressLogger} from './logger';
import {Inject} from 'typescript-ioc';
import {AuthController} from './auth/controller';
import {UserController} from './user/controller';
import {MonitoringController} from './monitoring/controller';
import {Model} from 'objection';
import {TenantController} from './tenant/controller';
import {ProfileController} from './profile/controller';
import express = require('express');
import {TransactionController} from './transaction/controller';
import {JobController} from './job/controller';
import * as dwolla from './dwolla';
import * as middleware from './middleware';
import {DwollaController} from './dwolla/controller';
import {InvitationController, InvitationCheckController} from './invitation/controller';
import {ContractorController} from './contractor/controller';
import {ContractorFundingSourceController, UserFundingSourceController} from './foundingSource/controller';

const knex = require('knex');
const path = require('path');
const cors = require('cors');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const passport = require('./auth/passport');


export class ApiServer {
    @Inject private config: Config;
    @Inject private logger: Logger;
    @Inject private expressLogger: ExpressLogger;
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

        this.app.use(methodOverride());

        this.app.use(this.expressLogger.middleware());

        this.app.use(express.static(path.join(__dirname, 'public'), {maxAge: 31557600000}));
        this.app.use(cors());
        this.app.use(passport.initialize());
        this.app.use(bodyParser.json({limit: '25mb'}));

        this.addAuthorization();

        this.app.use(middleware.authExtractor);
        this.app.use(middleware.requestId);
        this.app.use(middleware.correlationId);

        this.addControllers();
        Server.swagger(this.app, './dist/swagger.json', '/api-docs', this.config.get('swagger.host'), [this.config.get('swagger.schema')]);

        this.app.use(this.expressLogger.errorMiddleware());
        this.app.use(this.errorHandler.bind(this));
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
                await this.dwollaClient.webhooksCleanup();
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
        this.app.use('/contractors/invitations', passport.authenticate('jwt', {session: false}));
        this.app.use('/contractors/fundingSources', passport.authenticate('jwt', {session: false}));
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
            MonitoringController,
            InvitationController,
            InvitationCheckController,
            ContractorController,
            ContractorFundingSourceController,
            UserFundingSourceController
        );
    }

    private errorHandler(err, req, res, next): void {
        if (this.config.get('logs.stackDump')) {
            console.log(err);
        }

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
