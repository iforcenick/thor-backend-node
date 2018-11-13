import {ContextAwareInterface, RequestContext} from './context';
import * as _ from 'lodash';

export abstract class Logic {
    protected context: RequestContext;

    constructor(context: RequestContext) {
        this.context = context;
        const parent = this.constructor['__parent'];
        if (!parent) {
            throw new IoCMetadataMissing('Missing parent metadata, check if @AutoWired is present');
        }

        const prototype = parent.prototype;
        if (!prototype) {
            throw new IoCMetadataMissing('Missing parent metadata, check if @AutoWired is present');
        }

        for (const field of _.keys(prototype)) {
            if (prototype[field] instanceof ContextAwareInterface) {
                this[field] = _.clone(prototype[field]);
                this[field].setRequestContext(this.context);
            }
        }
    }

    abstract execute(...params): Promise<any>;
}

export class IoCMetadataMissing extends Error {}