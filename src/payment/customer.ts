import {IItem} from './base';
import * as _ from 'lodash';

export interface ICustomer extends IItem {
    firstName: string;
    lastName: string;
    email: string;
    ipAddress: string;
    type: string;
    status: string;
    created: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    dateOfBirth: string;
    ssn: string;
    phone: string;
    businessName: string;
    doingBusinessAs: string;
    businessType: string;
    businessClassification: string;
    ein: string;
    website: string;
    controller: Owner;

    updateableFields();
}

export class Owner implements IItem {
    id: string;
    localization: string;
    firstName: string;
    lastName: string;
    title: string;
    dateOfBirth: string;
    ssn: string;
    address: OwnerAddress;

    constructor(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.title = data.title;
        this.dateOfBirth = data.dateOfBirth;
        this.ssn = data.ssn;

        if (data.address) {
            this.address = new OwnerAddress(data.address);
        }
    }

    public setLocalization(url): Owner {
        this.localization = url;
        return this;
    }
}

export class OwnerAddress {
    address1: string;
    address2: string;
    city: string;
    stateProvinceRegion: string;
    postalCode: string;
    country: string;

    constructor(data) {
        this.address1 = data.address1;
        this.address2 = data.address2;
        this.city = data.city;
        this.stateProvinceRegion = data.stateProvinceRegion;
        this.postalCode = data.postalCode;
        this.country = data.country;
    }
}


export class BeneficialOwner implements IItem {
    id: string;
    localization: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    ssn: string;
    address: OwnerAddress;
    verificationStatus: string;

    constructor(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.dateOfBirth = data.dateOfBirth;
        this.ssn = data.ssn;
        this.verificationStatus = data.verificationStatus;

        if (data.address) {
            this.address = new OwnerAddress(data.address);
        }
    }

    public setLocalization(url): BeneficialOwner {
        this.localization = url;
        return this;
    }
}

export class Customer implements ICustomer {
    public created: string;
    public id: string;
    public firstName: string;
    public lastName: string;
    public email: string;
    public ipAddress: string;
    public type: string;
    public status: string;
    public localization: string;
    public address1: string;
    public address2: string;
    public city: string;
    public state: string;
    public postalCode: string;
    public dateOfBirth: string;
    public ssn: string;
    public phone: string;
    public businessName: string;
    public doingBusinessAs: string;
    public businessType: string;
    public businessClassification: string;
    public ein: string;
    public website: string;
    controller: Owner;

    constructor(data) {
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.ipAddress = data.ipAddress;
        this.id = data.id;
        this.city = data.city;
        this.state = data.state;
        this.postalCode = data.postalCode;
        this.dateOfBirth = data.dateOfBirth;
        this.ssn = data.ssn;
        this.phone = data.phone || undefined;
        this.address1 = data.address1;
        this.address2 = data.address2;
        this.type = data.type;
        this.status = data.status;
        this.businessName = data.businessName;
        this.doingBusinessAs = data.doingBusinessAs;
        this.businessType = data.businessType;
        this.businessClassification = data.businessClassification;
        this.ein = data.ein;
        this.website = data.website;

        if (data.controller) {
            this.controller = new Owner(data.controller);
        }
    }

    public setLocalization(url): ICustomer {
        this.localization = url;
        return this;
    }

    public updateableFields() {
        if (this.type == TYPE.Business) {
            return _.pick(this, [
                'email', 'phone', 'ipAddress', 'country', 'city', 'state', 'address1', 'address2', 'postalCode',
                'doingBusinessAs', 'website',
            ]);
        } else {
            if (this.status == CUSTOMER_STATUS.Verified) {
                return _.omit(this, ['dateOfBirth', 'firstName', 'lastName']);
            } else if (this.status == CUSTOMER_STATUS.Unverified) {
                return _.pick(this, ['firstName', 'lastName', 'email', 'businessName']);
            } else {
                return this;
            }
        }
    }
}

export const CUSTOMER_STATUS = {
    Unverified: 'unverified',
    Verified: 'verified',
    Retry: 'retry',
    Document: 'document',
    Suspended: 'suspended',
    Deactivated: 'deactivated',
};

export const BENEFICIAL_OWNER_STATUS = {
    Verified: 'Verified',
    Document: 'Document',
    Incomplete: 'Incomplete'
};


export const TYPE = {
    Personal: 'personal',
    Business: 'business'
};

export const BUSINESS_TYPE = {
    Sole: 'soleProprietorship',
    Corporation: 'corporation',
    Llc: 'llc',
    Partnership: 'partnership',
};

export const factory = (data): ICustomer => {
    return new Customer(data);
};

export const ownerFactory = (data): Owner => {
    return new Owner(data);
};

export const beneficialOwnerFactory = (data): BeneficialOwner => {
    return new BeneficialOwner(data);
};
