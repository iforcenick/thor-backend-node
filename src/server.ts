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
    private app: express.Application;
    private server: any = null;
    private port: number;
    private knex: any;

    constructor() {
        this.port = this.config.get('express.port');
        this.app = express();
        this.setupDB();

        if (Config.isDev()) {
            this.app.use(morgan('dev'));
        }

        this.app.use(
            express.static(path.join(__dirname, 'public'), {maxAge: 31557600000})
        );
        this.app.use(cors());
        this.app.use(passport.initialize());
        this.app.use(bodyParser.json({limit: '25mb'}));
        this.app.use(methodOverride());
        this.app.use(ApiServer.tokenExtractor);
        this.app.use(ApiServer.tenantExtractor);

        this.addAuthorization();
        this.app.use(this.logger.expressWinston);

        this.addControllers();
        Server.swagger(
            this.app,
            './dist/swagger.json',
            '/api-docs',
            'localhost:' + this.port,
            ['http']
        );

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
        const uuidv4 = require('uuid/v4');

        authContext.run(() => {
            const v = uuidv4();
            console.log(v);
            authContext.set('tenant', v);
            next();
        });
    }

    /**
     * Start the server
     * @returns {Promise<any>}
     */
    public start(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.server = this.app.listen(this.port, (err: any) => {
                if (err) {
                    return reject(err);
                }

                this.logger.info(
                    `Listening to http://${this.server.address().address}:${
                        this.server.address().port
                        }`
                );
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
        Model.knex(this.knex);
    }

    private addAuthorization() {
        // this.app.use('/user', passport.authenticate('jwt', {session: false}));
    }

    private addControllers() {
        Server.buildServices(
            this.app,
            UserController,
            AuthController,
            TenantController,
            ProfileController
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
