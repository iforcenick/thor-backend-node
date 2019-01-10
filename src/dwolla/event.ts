export const TYPE = {
    customerTransfer: {
        created: 'customer_transfer_created',
        cancelled: 'customer_transfer_cancelled',
        failed: 'customer_transfer_failed',
        completed: 'customer_transfer_completed',
    },
    customerBankTransfer: {
        created: 'customer_bank_transfer_created',
        creationFailed: 'customer_bank_transfer_creation_failed',
        cancelled: 'customer_bank_transfer_cancelled',
        failed: 'customer_bank_transfer_failed',
        completed: 'customer_bank_transfer_completed',
    },
    transfer: {
        completed: 'transfer_completed',
        cancelled: 'transfer_cancelled',
        failed: 'transfer_failed',
        reclaimed: 'transfer_reclaimed',
        created: 'transfer_created',
    },
    customerFundingSource: {
        added: 'customer_funding_source_added',
        removed: 'customer_funding_source_removed',
        verified: 'customer_funding_source_verified',
    },
    customer: {
        created: 'customer_created',
        verificationDocumentNeeded: 'customer_verification_document_needed',
        verificationDocumentUploaded: 'customer_verification_document_uploaded',
        verificationDocumentApproved: 'customer_verification_document_approved',
        verificationDocumentFailed: 'customer_verification_document_failed',
        reverificationNeeded: 'customer_reverification_needed',
        verified: 'customer_verified',
        suspended: 'customer_suspended',
        activated: 'customer_activated',
        deactivated: 'customer_deactivated',
    },
    customerBeneficialOwner: {
        created: 'customer_beneficial_owner_created',
        removed: 'customer_beneficial_owner_removed',
        verificationDocumentNeeded: 'customer_beneficial_owner_verification_document_needed',
        verificationDocumentUploaded: 'customer_beneficial_owner_verification_document_uploaded',
        verificationDocumentFailed: 'customer_beneficial_owner_verification_document_failed',
        verificationDocumentApproved: 'customer_beneficial_owner_verification_document_approved',
        reverificationNeeded: 'customer_beneficial_owner_reverification_needed',
        verified: 'customer_beneficial_owner_verified',
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
