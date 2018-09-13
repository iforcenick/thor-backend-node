export const TYPE = {
    customerTransferCompleted: 'customer_transfer_completed',
    customerTransferCancelled: 'customer_transfer_cancelled',
    customerTransferFailed: 'customer_transfer_failed',
    customerBankTransferCreated: 'customer_bank_transfer_created',
    transferCompleted: 'transfer_completed',
    transferCanceled: 'transfer_cancelled',
    transferFailed: 'transfer_failed',
    transferReclaimed: 'transfer_reclaimed',
    transferCreated: 'transfer_created',
};

export interface IEvent {
    _links: any;
    id: string;
    topic: string;
    resourceId: string;
    created: string;

    getResourceUrl(): string;
}

export class Event implements IEvent {
    public _links: any;
    public id: string;
    public topic: string;
    public resourceId: string;
    public created: string;

    constructor(data) {
        this._links = data._links;
        this.id = data.id;
        this.topic = data.topic;
        this.resourceId = data.resourceId;
        this.created = data.created;

        if (!this._links) {
            this._links = {
                resource: {
                    href: undefined,
                },
            };
        }
    }

    public getResourceUrl(): string {
        return this._links.resource.href;
    }
}

export const factory = (data): IEvent => {
    return new Event(data);
};

// export const checkWebhookSignature = (signature, secret, payload: string): boolean => {
//     const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
//     return signature === hash;
// };
