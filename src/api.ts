import Joi = require('joi');
import {ValidationError} from './errors';
import * as mapper from './mapper';

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
