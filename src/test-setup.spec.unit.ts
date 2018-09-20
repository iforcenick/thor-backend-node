import * as sinon from 'sinon';
export let sandbox;

beforeEach(() => {
    sandbox = sinon.createSandbox();
});

afterEach(() => {
    sandbox.restore();
});