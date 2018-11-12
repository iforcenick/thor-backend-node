import {ContextAwareInterface, RequestContext} from './context';
import * as _ from 'lodash';

export abstract class Logic {
    protected context: RequestContext;

    constructor(context: RequestContext) {
        this.context = context;
        const prototype = this.constructor['__parent'].prototype;

        for (const field of _.keys(prototype)) {
            if (prototype[field] instanceof ContextAwareInterface) {
                prototype[field].setRequestContext(this.context);
            }
        }
    }

    abstract execute(...params): Promise<any>;
}