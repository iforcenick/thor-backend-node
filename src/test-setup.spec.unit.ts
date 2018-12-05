import 'reflect-metadata';

import * as sinon from 'sinon';
export let sandbox;
export {sinon};

beforeEach(() => {
    sandbox = sinon.createSandbox();
});

afterEach(() => {
    sandbox.restore();
});