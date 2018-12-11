import {Context, Errors, ServiceContext} from 'typescript-rest';
import {ValidationError} from './errors';
import * as mapper from './mapper';
import * as role from './user/role';
import * as db from './db';
import * as context from './context';
import {RequestContext} from './context';
import {Inject} from 'typescript-ioc';
import {Logger} from './logger';
import {Config} from './config';
import {Auth} from './auth/models';
import * as roleChecks from './user/role/checks';
import Joi = require('joi');

export {mapper};

export interface Pagination {
    total: number;
    limit: number;
    page: number;
    pages: number;
}

export interface PaginatedResponse {
    pagination: Pagination;
}

const validationOptions = {
    abortEarly: false, // abort after the last validation error
    allowUnknown: true, // allow unknown keys that will be ignored
    stripUnknown: true // remove unknown keys from the validated data
};

export class BaseController {
    @Inject protected logger: Logger;
    @Inject protected config: Config;
    @Context protected context: ServiceContext; // needs to be injected manually if extending another instance
    private requestContext: context.RequestContext;

    static _requireRole(req: any, role: role.models.Types) {
        const auth: Auth = req.auth;
        if (!auth.hasRole(role)) {
            throw new Errors.ForbiddenError();
        }

        return req;
    }

    static _checkRoles(req: any, checkCallback: any) {
        const auth: Auth = req.auth;
        for (const role of auth.roles) {
            if (checkCallback(role)) {
                return req;
            }
        }

        throw new Errors.ForbiddenError();
    }

    static requireAdmin(req: any) {
        return BaseController._requireRole(req, role.models.Types.admin);
    }

    static requireAdminReader(req: any) {
        return BaseController._checkRoles(req, roleChecks.isAdminReader);
    }

    static requireContractor(req: any) {
        return BaseController._requireRole(req, role.models.Types.contractor);
    }

    getRequestContext(): RequestContext {
        if (!this.context) {
            throw new ContextMissingError('Controller context not available yet');
        }

        if (!this.requestContext) {
            this.requestContext = new context.RequestContext(this.context);
        }

        return this.requestContext;
    }

    validate(data, schema): Promise<any> {
        return new Promise((resolve, reject) => {
            Joi.validate(data, schema, validationOptions, (err, value) => {
                if (err) {
                    reject(new ValidationError(err));
                } else {
                    resolve(value);
                }
            });
        });
    }

    map(mapper, data) {
        return new mapper().map(data);
    }

    paginate(pagination: db.Pagination, data) {
        return {
            items: data,
            pagination: {
                total: pagination.total,
                limit: pagination.limit,
                page: pagination.page,
                pages: pagination.pages,
            },
        };
    }
}

export const dateRangeSchema = Joi.object().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
});

export class BaseError extends Error {
    message: string;

    constructor(message: string) {
        super();
        this.message = message;
    }
}

export class ContextMissingError extends BaseError {
}