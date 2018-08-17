import * as db from '../../db';
import {Mapper} from '../../mapper';
import {mapper} from '../../api';

export enum Types {
    admin = 'admin',
    customer = 'customer',
}

export class Role extends db.Model {
    static tableName = db.Tables.roles;
    name?: string;
}

export class RoleResponse extends Mapper {
    id: number = mapper.FIELD_NUM;
    name: string = mapper.FIELD_STR;
}