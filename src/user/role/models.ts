import * as db from '../../db';
import {Mapper} from '../../mapper';
import {mapper} from '../../api';

export enum Types {
    admin = 'admin',
    contractor = 'contractor',
}

export class Role extends db.Model {
    static tableName = db.Tables.roles;
    name?: string = null;
}

export class RoleResponse extends Mapper {
    name: string = mapper.FIELD_STR;
}