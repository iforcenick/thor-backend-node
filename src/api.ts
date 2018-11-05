import {Context, Errors, ServiceContext} from 'typescript-rest';
import Joi = require('joi');
import {ValidationError} from './errors';
import * as mapper from './mapper';
import * as user from './user/models';
import * as role from './user/role';
import * as db from './db';
import * as context from './context';
import {Inject} from 'typescript-ioc';
import {Logger} from './logger';
import {Config} from './config';
import {RequestContext} from './context';

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
    @Context private context: ServiceContext;
    private requestContext: context.RequestContext;

    static _requireRole(req: any, role: role.models.Types) {
        const user: user.User = req.user;
        if (!user || !user.hasRole(role)) {
            throw new Errors.ForbiddenError();
        }

        return req;
    }

    static requireAdmin(req: any) {
        return BaseController._requireRole(req, role.models.Types.admin);
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

export class ContextMissingError extends Error {
}