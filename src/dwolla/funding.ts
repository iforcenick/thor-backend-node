import {IItem} from './base';

export interface ISource extends IItem {
    status: string;
    type: string;
    bankAccountType: string;
    name: string;
    created: string;
    balance: string;
    removed: boolean;
    channels: any;
    bankName: string;
    fingerprint: string;
    microInitiate: boolean;
    microVerify: boolean;

    verificationStatus();
}

export class Source implements ISource {
    public id: string;
    public status: string;
    public type: string;
    public bankAccountType: string;
    public name: string;
    public created: string;
    public balance: string;
    public removed: boolean;
    public channels: any;
    public bankName: string;
    public fingerprint: string;
    public localization: string;
    microInitiate: boolean;
    microVerify: boolean;

    constructor(data: any) {
        this.name = data.name;
        this.id = data.id;
        this.status = data.status;
        this.type = data.type;
        this.bankAccountType = data.bankAccountType;
        this.created = data.created;
        this.removed = data.removed;
        this.channels = data.channels;
        this.bankName = data.bankName;
        this.fingerprint = data.fingerprint;
        this.balance = data.balance;
        this.microInitiate = !!data._links['initiate-micro-deposits'];
        this.microVerify = !!data._links['verify-micro-deposits'];
    }

    public verificationStatus() {
        if (this.status == 'verified') {
            return 'completed';
        }

        if (this.microVerify) {
            return 'initiated';
        }

        return null;
    }

    public setLocalization(url): ISource {
        this.localization = url;
        return this;
    }
}

export const factory = (data): ISource => {
    return new Source(data);
};
