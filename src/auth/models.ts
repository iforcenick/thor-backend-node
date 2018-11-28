import {UserResponse} from '../user/dto';
import Joi = require('joi');

export class AuthUserResponse extends UserResponse {
    token: string;
}

export interface LoginRequest {
    login: string;
    password: string;
}

export interface PasswordRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const loginRequestSchema = Joi.object().keys({
    login: Joi.string().required(),
    password: Joi.string().required(),
});
export const passwordRequestSchema = Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmPassword: Joi.string().required(),
});
