import {ApiServer} from '../src/server';

const server = new ApiServer();
export let app = null;

export const start = () => {
    app = server.startTest();
};

export const stop = async () => {
    await server.stop();
};