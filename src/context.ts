import {ServiceContext} from 'typescript-rest';
import {User} from './user/models';
import {Auth} from './auth/models';

export class RequestContext {
    private context: ServiceContext;
    private auth: Auth;
    private _tenantId: string;

    constructor(context: ServiceContext) {
        this.context = context;
        this.auth = context.request['auth'];
    }

    getTenantId(): string {
        if (this._tenantId) {
            return this._tenantId;
        }
        return this.auth.tenantId;
    }

    setForceTenantId(id: string) {
        this._tenantId = id;
    }

    getUserId(): string {
        if (this.auth.userId) {
            return this.auth.userId;
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