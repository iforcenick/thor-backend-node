import * as role from '../user/role';

export enum AuthType {
    SYSTEM = 'SYSTEM',
    TENANT = 'TENANT',
    ANONYMOUS = 'ANONYMOUS',
}

export class Auth {
    tenantId: string = null;
    userId: string = null;
    roles: Array<string> = [];
    type: AuthType = AuthType.ANONYMOUS;

    hasRole(role: role.models.Types) {
        return this.roles.includes(role);
    }

    toJwt() {
        return {
            aty: this.type,
            uid: this.userId,
            tid: this.tenantId,
            rol: this.roles.join(','),
        };
    }

    static fromJwt(payload: any) {
        const auth = new Auth();
        auth.type = payload.aty;
        auth.userId = payload.uid;
        auth.tenantId = payload.tid;
        auth.roles = payload.rol.split(',');
        return auth;
    }
}



