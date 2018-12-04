import * as role from '../user/role';

export enum AuthType {
    SYSTEM = 'SYSTEM',
    TENANT = 'TENANT',
    NONE = 'NONE',
}

export class Auth {
    tenantId: string;
    userId: string;
    roles: Array<string>;
    type: AuthType;

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



