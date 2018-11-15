import {ServiceContext} from 'typescript-rest';
import {User} from './user/models';

export class RequestContext {
    private context: ServiceContext;
    private _tenantId: string;

    constructor(context: ServiceContext) {
        this.context = context;
        this._tenantId = this.context.request['tenantId'];
    }

    getTenantId(): string {
        return this._tenantId;
    }

    setForceTenantId(id: string) {
        this._tenantId = id;
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