import express = require('express');
import {Model} from 'objection';
import {Inject} from 'typescript-ioc';
import {Server} from 'typescript-rest';
import {Config} from './config';
import {AuthController} from './auth/controller';
import {UserController, ContractorUserController} from './user/controller';
import {MonitoringController} from './monitoring/controller';
import {TenantController, TenantCompanyController} from './tenant/controller';
import {ProfileController, UserProfileController} from './profile/controller';
import {TransactionController, UserTransactionController} from './transaction/controller';
import {JobController} from './job/controller';
import {WebhookController} from './webhooks/controller';
import {InvitationController, UserInvitationController, InvitationCheckController} from './invitation/controller';
import {ContractorController} from './contractor/controller';
import {DocumentController, UserDocumentController, ContractorDocumentController} from './document/controller';
import {
    FundingSourceController,
    UserFundingSourceController,
    ContractorFundingSourceController,
} from './fundingSource/controller';
import {BeneficialOwnerController} from './tenant/beneficialOwner/controller';
import {TenantFundingSourcesController} from './tenant/fundingSource/controller';
import {Logger, ExpressLogger} from './logger';
import * as middleware from './middleware';
import * as payments from './payment';

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
    @Inject private paymentClient: payments.PaymentClient;
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
        Server.swagger(this.app, './dist/swagger.json', '/api-docs', this.config.get('swagger.host'), [
            this.config.get('swagger.schema'),
        ]);

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

                try {
                    await this.paymentClient.webhooksCleanup();
                } catch (e) {
                    this.logger.error(`Dwolla webhooks cleanup error: ${e.message}`);
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
        const db = {
            autoMigrate: this.config.get('db.autoMigrate'),
            client: this.config.get('db.client'),
            connection: {
                host: this.config.get('db.connection.host'),
                port: this.config.get('db.connection.port'),
                user: this.config.get('db.connection.user'),
                password: this.config.get('db.connection.password'),
                database: this.config.get('db.connection.database'),
            },
        };
        this.knex = knex(db);
        if (this.config.get('db.autoMigrate')) {
            this.knex.migrate.latest();
        }

        ApiServer.db = this.knex;
        Model.knex(this.knex);
    }

    private addAuthorization() {
        this.app.use('/users', passport.authenticate('jwt', {session: false}));
        this.app.use('/jobs', passport.authenticate('jwt', {session: false}));
        this.app.use('/transactions', passport.authenticate('jwt', {session: false}));
        this.app.use('/tenants', passport.authenticate('jwt', {session: false}));
        this.app.use('/auth/password', passport.authenticate('jwt', {session: false}));
        this.app.use('/contractors', passport.authenticate('jwt', {session: false}));
        this.app.use('/fundingSources', passport.authenticate('jwt', {session: false}));
        this.app.use('/profiles', passport.authenticate('jwt', {session: false}));
        this.app.use('/invitations', passport.authenticate('jwt', {session: false}));
        this.app.use('/documents', passport.authenticate('jwt', {session: false}));
    }

    private addControllers() {
        Server.buildServices(
            this.app,
            // /auth
            AuthController,
            // /users
            UserController,
            // /users/:userId/contractors
            ContractorUserController,
            // /tenants
            TenantController,
            // /tenants/company
            TenantCompanyController,
            // /profiles
            ProfileController,
            // /users/:userId/profiles
            UserProfileController,
            // /jobs
            JobController,
            // /dwolla
            WebhookController,
            // /
            MonitoringController,
            // /contractors
            ContractorController,
            // /tenants/company/beneficialOwners
            BeneficialOwnerController,
            // /transactions
            TransactionController,
            // /users/:userId/transactions
            UserTransactionController,
            // /invitations
            InvitationController,
            // /users/:userId/invitations
            UserInvitationController,
            // //public/invitations
            InvitationCheckController,
            // /fundingSources
            FundingSourceController,
            // /contractors/fundingSources
            ContractorFundingSourceController,
            // /users/:userId/fundingSources
            UserFundingSourceController,
            // /tenant/fundingSources
            TenantFundingSourcesController,
            // /documents
            DocumentController,
            // /contractors/documents
            ContractorDocumentController,
            // /users/:userId/fundingSources
            UserDocumentController,
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
