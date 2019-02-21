'use strict';

import 'reflect-metadata';
import SandboxIoC from './ioc';
import {ApiServer} from './server';

export const start = (): Promise<void> => {
    SandboxIoC.configure();
    return new Promise<void>((resolve, reject) => {
        const apiServer = new ApiServer();
        apiServer.start()
            .then(resolve)
            .catch(reject);

        const graceful = () => {
            apiServer.stop().then(() => process.exit(0));
        };

        // Stop graceful
        process.on('SIGTERM', graceful);
        process.on('SIGINT', graceful);
    });
};

start()
    .catch((err) => {
        console.error(`Error starting server: ${err.message}`);
        process.exit(-1);
    });
