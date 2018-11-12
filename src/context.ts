import {ServiceContext} from 'typescript-rest';
import {User} from './user/models';

export class RequestContext {
    private context: ServiceContext;

    constructor(context: ServiceContext) {
        this.context = context;
    }

    getTenantId(): string {
        if (this.context.request['tenantId']) {
            return this.context.request['tenantId'];
        }
        throw new RequestContextMissingTenantError();
    }

    getUser(): User {
        if (this.context.request['user']) {
            return this.context.request['user'];
        }
        throw new RequestContextMissingUserError();
    }
}

export class RequestContextMissingError extends Error {
}

export class RequestContextMissingTenantError extends Error {
}

export class RequestContextMissingUserError extends Error {
}