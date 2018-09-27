import {AutoWired} from 'typescript-ioc';

const getNamespace = require('continuation-local-storage').getNamespace;

export const enum Type {
    auth = 'authContext',
    request = 'requestContext',
}

export interface IContext {
    get(): any;

    getNamespaceName(): string;
}

export abstract class Context implements IContext {
    namespace: any;
    value: any;

    constructor() {
        this.namespace = getNamespace(this.getNamespaceName());
        this.set();
    }

    get() {
        return this.value;
    }

    protected abstract set();

    abstract getNamespaceName();
}

@AutoWired
export class TenantContext extends Context {
    set() {
        this.value = this.namespace.get('tenant');
    }

    getNamespaceName() {
        return Type.auth;
    }
}

@AutoWired
export class UserContext extends Context {
    set() {
        this.value = this.namespace.get('user');
    }

    getNamespaceName() {
        return Type.auth;
    }
}

@AutoWired
export class RequestIdContext extends Context {
    set() {
        this.value = this.namespace.get('requestId');
    }

    getNamespaceName() {
        return Type.request;
    }
}

@AutoWired
export class CorrelationIdContext extends Context {
    set() {
        this.value = this.namespace.get('correlationId');
    }

    getNamespaceName() {
        return Type.request;
    }
}