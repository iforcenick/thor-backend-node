import Joi = require('joi');
import {UserResponse} from '../user/dto';
import {mapper} from '../api';
import {Mapper} from '../mapper';

export class AuthUserResponse extends UserResponse {
    token: string = mapper.FIELD_STR;
}

export class LoginRequest extends Mapper {
    login: string = mapper.FIELD_STR;
    password: string = mapper.FIELD_STR;
}

export class PasswordRequest extends Mapper {
    oldPassword: string = mapper.FIELD_STR;
    newPassword: string = mapper.FIELD_STR;
}

export const loginRequestSchema = Joi.object().keys({
    login: Joi.string().required(),
    password: Joi.string().required(),
});
export const passwordRequestSchema = Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
});