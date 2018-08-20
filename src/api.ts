import {Errors} from 'typescript-rest';
import Joi = require('joi');
import {ValidationError} from './errors';
import * as mapper from './mapper';
import * as user from './user/models';
import * as role from './user/role';

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

export class BaseController {
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

    static requireCustomer(req: any) {
        return BaseController._requireRole(req, role.models.Types.customer);
    }

    validate(data, schema) {
        return new Promise((resolve, reject) => {
            Joi.validate(data, schema, (err, value) => {
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

    paginate(pagination, data) {
        return {
            'items': data,
            'pagination': {
                'total': pagination.total,
                'limit': pagination.limit,
                'page': pagination.page,
                'pages': pagination.pages,
            }
        };
    }
}
