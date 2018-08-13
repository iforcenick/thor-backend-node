import {PaginatedResponse, mapper} from '../api';
import {Mapper} from '../mapper';
import * as db from '../db';
import Joi = require('joi');

export class User extends db.Model {
    static tableName = 'users';
    phone?: string;
    name?: string;
    email?: string;
    password?: string;
    createdAt?: Date;
    updatedAt?: Date;

    $beforeInsert() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    $beforeUpdate() {
        this.updatedAt = new Date();
    }
}

export class UserBaseInfo extends Mapper {
    phone: string = mapper.FIELD;
    name: string = mapper.FIELD;
    email: string = mapper.FIELD;
}

export class UserResponse extends UserBaseInfo {
    id: string = mapper.FIELD;
}

export class UserRequest extends UserBaseInfo {
    password: string = mapper.FIELD;
}

export interface PaginatedUserReponse extends PaginatedResponse {
    items: Array<UserResponse>;
}

export const userRequestSchema = Joi.object().keys({
    phone: Joi.string().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
});
