import {RequestContext} from './context';

export abstract class Logic {
    protected context: RequestContext;

    constructor(context: RequestContext) {
        this.context = context;
    }

    abstract execute(...params): Promise<any>;
}