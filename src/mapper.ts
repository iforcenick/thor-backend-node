import * as _ from 'lodash';

export const FIELD_STR = '';
export const FIELD_NUM = 0;
export const FIELD_DATE = new Date();
export const FIELD_ARR = [];
export const FIELD_BOOLEAN = false;

export const object = (mapper) => {
    return (target: any, propertyKey: string | symbol) => {
        Reflect.defineMetadata('mapper', mapper, target, propertyKey);
    };
};

export const array = (mapper) => {
    return (target: any, propertyKey: string | symbol) => {
        Reflect.defineMetadata('mapper', mapper, target, propertyKey);
        Reflect.defineMetadata('arrayMapped', true, target, propertyKey);
    };
};

export const fromName = (name) => {
    return (target: any, propertyKey: string | symbol) => {
        Reflect.defineMetadata('fromName', name, target, propertyKey);
    };
};

export class Mapper {
    map(data) {
        for (const key of Object.keys(this)) {
            let fromName = Reflect.getMetadata('fromName', this, key);
            if (!fromName) {
                fromName = key;
            }
            if (data[fromName]) {
                if (_.isObject(this[key])) {
                    const mapper = Reflect.getMetadata('mapper', this, key);
                    if (mapper) {
                        if (Reflect.getMetadata('arrayMapped', this, key)) {
                            const mappedObjects = [];
                            for (const obj of data[fromName]) {
                                mappedObjects.push(new mapper().map(obj));
                            }

                            this[key] = mappedObjects;
                        } else {
                            this[key] = new mapper().map(data[fromName]);
                        }
                    }
                } else {
                    this[key] = data[fromName];
                }
            } else {
                this[key] = null;
            }
        }
        return this;
    }
}
