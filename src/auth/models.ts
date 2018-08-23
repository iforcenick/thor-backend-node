import {UserResponse} from '../user/models';
import Joi = require('joi');

export class AuthUserResponse extends UserResponse {
}

export const loginRequestSchema = Joi.object().keys({
    login: Joi.string().required(),
    password: Joi.string().required(),
    tenant: Joi.string().required(),
});
export const passwordRequestSchema = Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmPassword: Joi.string().required(),
});
