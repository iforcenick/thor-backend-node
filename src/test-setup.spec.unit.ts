import 'reflect-metadata';

import * as sinon from 'sinon';
import {CorrelationIdContext, RequestIdContext, TenantContext, UserContext} from './context';
import {AutoWired, Provides} from 'typescript-ioc';
export let sandbox;

@AutoWired
@Provides(RequestIdContext)
export class TestRequestIdContext extends RequestIdContext {
    set() {
        this.value = 'requestId';
    }
}

@AutoWired
@Provides(CorrelationIdContext)
export class TestCorrelationIdContext extends CorrelationIdContext {
    set() {
        this.value = 'correlationId';
    }
}

@AutoWired
@Provides(UserContext)
export class TestUserContext extends UserContext {
    set() {
        this.value = {};
    }
}

@AutoWired
@Provides(TenantContext)
export class TestTenantContext extends TenantContext {
    set() {
        this.value = {};
    }
}

beforeEach(() => {
    sandbox = sinon.createSandbox();
});

afterEach(() => {
    sandbox.restore();
});