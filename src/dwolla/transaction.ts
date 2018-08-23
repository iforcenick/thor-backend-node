import {IItem} from './base';

export interface ITransaction extends IItem {
    _links: any;
    amount: any;
    metadata: any;
    correlationId: string;
    status: string;

    getSource(): string;

    setSource(source): ITransaction;

    getDestination(): string;

    setDestination(destination): ITransaction;

    getAmount(): number;

    setAmount(value: number): ITransaction;

    getCurrency(): string;

    setCurrency(currency): ITransaction;
}

export class Transaction implements ITransaction {
    public _links: any;
    public amount: any;
    public metadata: any;
    public correlationId: string;
    public id: string;
    public localization: string;
    public status: string;

    constructor(data) {
        this._links = data._links;
        this.amount = data.amount;
        this.metadata = data.metadata;
        this.correlationId = data.correlationId;
        this.id = data.id;
        this.localization = data.localization;
        this.status = data.status;

        if (!this._links) {
            this._links = {
                source: {
                    href: undefined,
                },
                destination: {
                    href: undefined,
                },
            };
        }

        if (!this.amount) {
            this.amount = {
                currency: undefined,
                value: undefined,
            };
        }
    }

    public setLocalization(url): ITransaction {
        this.localization = url;
        return this;
    }

    public getSource(): string {
        return this._links.source.href;
    }

    public setSource(source: string): ITransaction {
        this._links.source.href = source;
        return this;
    }

    public getDestination(): string {
        return this._links.destination.href;
    }

    public setDestination(destination: string): ITransaction {
        this._links.destination.href = destination;
        return this;
    }

    public getAmount(): number {
        return this.amount.value;
    }

    public setAmount(value: number): ITransaction {
        this.amount.value = value;
        return this;
    }

    public getCurrency(): string {
        return this.amount.currency;
    }

    public setCurrency(currency: string): ITransaction {
        this.amount.currency = currency;
        return this;
    }
}

export const factory = (data): ITransaction => {
    return new Transaction(data);
};
