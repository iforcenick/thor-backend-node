import * as _ from 'lodash';

export const FIELD_STR = '';
export const FIELD_NUM = 0;
export const FIELD_DATE = new Date();
export const FIELD_ARR = [];
export const FIELD_BOOLEAN = false;

const relations = {};

export const registerRelation = (mapper, field, relation) => {
    if (!relations[mapper.name]) {
        relations[mapper.name] = {};
    }
    relations[mapper.name][field] = relation;
};

export class Relation {
    mapper: Mapper;

    constructor(mapper) {
        this.mapper = new mapper();
    }
}

export class ArrayRelation extends Relation {
}

export class Mapper {
    checkRelation(key, data): boolean {
        const mapper = relations[this.constructor.name];
        if (!mapper) {
            return false;
        }

        const relation = mapper[key];
        if (!relation) {
            return false;
        }

        if (relation instanceof ArrayRelation) {
            if (data[key] == undefined) {
                this[key] = [];
                return true;
            }

            const entityArray = [];
            for (const entry of data[key]) {
                entityArray.push(_.clone(relation.mapper.map(entry)));
            }

            this[key] = entityArray;

            return true;
        } else if (relation instanceof Relation) {
            if (data[key] == undefined) {
                this[key] = null;
                return true;
            }

            this[key] = relation.mapper.map(data[key]);
            return true;
        }

        return false;
    }

    map(data) {
        for (const key of Object.keys(this)) {
            if (this.checkRelation(key, data)) {
                continue;
            }
            if (data[key] !== undefined) {
                this[key] = data[key];
            } else {
                delete this[key];
            }
        }
        return _.cloneDeep(this);
    }
}
