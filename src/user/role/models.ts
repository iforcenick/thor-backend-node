import * as db from '../../db';
import {Mapper} from '../../mapper';
import {mapper} from '../../api';

export enum Types {
    admin = 'admin',
    adminReader = 'adminReader',
    contractor = 'contractor',
}

export const roleExists = (role) => {
    return Object.values(Types).includes(role);
};

export const isAdminRole = (role) => {
    return [Types.admin, Types.adminReader].includes(role);
};

export class Role extends db.Model {
    static tableName = db.Tables.roles;
    name?: string = null;
}

export class RoleResponse extends Mapper {
    name: string = mapper.FIELD_STR;
}