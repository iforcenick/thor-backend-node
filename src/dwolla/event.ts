export const TYPE = {
    customerTransfer : {
        completed : 'customer_transfer_completed',
        cancelled: 'customer_transfer_cancelled',
        failed: 'customer_transfer_failed'

    },
    customerBankTransfer : {
        created : 'customer_bank_transfer_created'
    },
    transfer : {
        completed: 'transfer_completed',
        canceled: 'transfer_cancelled',
        failed: 'transfer_failed',
        reclaimed: 'transfer_reclaimed',
        created: 'transfer_created',
    },
    customerFundingSource : {
        added: 'customer_funding_source_added',
    },
    customer: {
        created: 'customer_created',
        verificationDocumentNeeded : 'customer_verification_document_needed',
        reverificationNeeded: 'customer_reverification_needed'
    }
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
