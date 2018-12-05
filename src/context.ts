import {ServiceContext} from 'typescript-rest';
import {Auth, AuthType} from './auth/models';

export class RequestContext {
    private context: ServiceContext;
    private auth: Auth;
    private tenantIdOverride: string;
    private tenantIdClaimOverride: string;

    constructor(context: ServiceContext) {
        this.context = context;
        this.auth = context.request['auth'];
    }

    getTenantId(): string {
        if (this.tenantIdOverride) {
            return this.tenantIdOverride;
        }

        if (this.auth.type == AuthType.ANONYMOUS) {
            return null;
        }

        if (this.auth.type == AuthType.SYSTEM) {
            const claim = this.getTenantIdClaim();
            if (claim) {
                return claim;
            }
        }

        return this.auth.tenantId;
    }

    private getTenantIdClaim(): string {
        return this.tenantIdClaimOverride ? this.tenantIdClaimOverride : this.getHeader('X-Tenant-Claim');
    }

    setTenantIdOverride(id: string) {
        this.tenantIdOverride = id;
    }

    setTenantIdClaimOverride(id: string) {
        this.tenantIdClaimOverride = id;
    }

    getUserId(): string {
        if (this.auth.userId) {
            return this.auth.userId;
        }
        throw new RequestContextMissingUserError();
    }

    getAuth(): Auth {
        return this.auth;
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