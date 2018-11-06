import {Errors} from 'typescript-rest';
import * as Joi from 'joi';
import * as _ from 'lodash';

export class ValidationError extends Errors.ConflictError {
    entity: any;

    constructor(entity?: any) {
        let message;
        if (entity instanceof String || typeof (entity) === 'string') {
            message = <string>entity;
        } else {
            message = ValidationError.buildValidationErrorString(entity);
        }

        super(message);
        this.entity = {error: message};
        Object.setPrototypeOf(this, ValidationError.prototype);
    }

    private static buildValidationErrorString(err: any) {
        const fields = {};

        err.details.forEach(e => {
            let pointer = fields;
            const last = e.path.slice(-1)[0];

            for (let i = 0; i < e.path.length - 1; i++) { // skip last row
                const field = e.path[i];
                if (!_.has(pointer, field)) {
                    pointer[field] = {};
                }

                pointer = pointer[field];
            }

            if (!_.has(pointer, last)) {
                pointer[last] = [];
            }

            pointer[last].push({
                message: e.message,
                type: e.type,
            });
        });

        return fields;
    }
}