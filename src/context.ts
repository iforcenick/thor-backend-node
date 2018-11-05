import {ServiceContext} from 'typescript-rest';
import {User} from './user/models';

export class RequestContext {
    private context: ServiceContext;

    constructor(context: ServiceContext) {
        this.context = context;
    }

    getTenantId(): string {
        return this.context.request['tenantId'];
    }

    getUser(): User {
        return this.context.request['user'];
    }
}

export class RequestContextMissingError extends Error {
}
