import {IItem} from './base';

export interface ITransfer extends IItem {
    _links: any;
    amount: any;
    metadata: any;
    correlationId: string;
    status: string;

    getSource(): string;

    setSource(source): ITransfer;

    getDestination(): string;

    setDestination(destination): ITransfer;

    getAmount(): number;

    setAmount(value: number): ITransfer;

    getCurrency(): string;

    setCurrency(currency): ITransfer;
}

export class Transaction implements ITransfer {
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

    public setLocalization(url): ITransfer {
        this.localization = url;
        return this;
    }

    public getSource(): string {
        return this._links.source.href;
    }

    public setSource(source: string): ITransfer {
        this._links.source.href = source;
        return this;
    }

    public getDestination(): string {
        return this._links.destination.href;
    }

    public setDestination(destination: string): ITransfer {
        this._links.destination.href = destination;
        return this;
    }

    public getAmount(): number {
        return this.amount.value;
    }

    public setAmount(value: number): ITransfer {
        this.amount.value = value;
        return this;
    }

    public getCurrency(): string {
        return this.amount.currency;
    }

    public setCurrency(currency: string): ITransfer {
        this.amount.currency = currency;
        return this;
    }
}

export const factory = (data): ITransfer => {
    return new Transaction(data);
};
