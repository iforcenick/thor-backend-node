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
        if (this.context.request['user']) {
            return this.context.request['user'];
        }
        throw new RequestContextMissingUserError();
    }

    getHeader(header: string) {
        return this.context.request.header(header);
    }
}

export class ContextAwareInterface {
    protected requestContext: RequestContext;

    setRequestContext(requestContext: RequestContext) {
        this.requestContext = requestContext;
    }

    getRequestContext(): RequestContext {
        if (!this.requestContext) {
            throw new RequestContextMissingError(`Request context not passed to service`);
        }

        return this.requestContext;
    }
}

export class RequestContextMissingError extends Error {
}

export class RequestContextMissingTenantError extends Error {
}

export class RequestContextMissingUserError extends Error {
}