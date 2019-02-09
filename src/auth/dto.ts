import Joi = require('joi');
import {mapper} from '../api';
import {UserResponse} from '../user/dto';
import {Mapper} from '../mapper';

export class AuthUserResponse extends UserResponse {
    token: string = mapper.FIELD_STR;
}

export class LoginRequest extends Mapper {
    login: string = mapper.FIELD_STR;
    password: string = mapper.FIELD_STR;
}

export class RegisterUserRequest extends Mapper {
    invitationToken: string = mapper.FIELD_STR;
    email: string = mapper.FIELD_STR;
    password: string = mapper.FIELD_STR;
}

export class ChangePasswordRequest extends Mapper {
    oldPassword: string = mapper.FIELD_STR;
    newPassword: string = mapper.FIELD_STR;
}

export class ResetPasswordRequest extends Mapper {
    resetToken: string = mapper.FIELD_STR;
    newPassword: string = mapper.FIELD_STR;
}

export const loginRequestSchema = Joi.object().keys({
    login: Joi.string().required(),
    password: Joi.string().required(),
});

export const registerUserRequestSchema = Joi.object().keys({
    invitationToken: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
});

export const passwordRequestSchema = Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
});

export const resetPasswordRequestSchema = Joi.object().keys({
    resetToken: Joi.string().required(),
    newPassword: Joi.string().required(),
});