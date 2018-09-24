import {IItem} from './base';

export interface IDocument extends IItem {
    type: string;
    status: string;
    created: string;
    failureReason: string;
}

export class Document implements IDocument {
    type: string;
    status: string;
    created: string;
    failureReason: string;
    id: string;
    localization: string;

    constructor(data) {
        this.type = data.type;
        this.status = data.status;
        this.created = data.created;
        this.failureReason = data.failureReason;
        this.id = data.id;
    }

    public setLocalization(url): IDocument {
        this.localization = url;
        return this;
    }
}

export const factory = (data): IDocument => {
    return new Document(data);
};

export const TYPE = {
    passport: 'passport',
    license: 'license',
    idCard: 'idCard',
    other: 'other',
};