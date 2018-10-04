import {IItem} from './base';
import * as profile from '../profile/models';

export interface ICustomer extends IItem {
    firstName: string;
    lastName: string;
    email: string;
    businessName: string;
    ipAddress: string;
    type: string;
    status: string;
    created: string;
}

export class Customer implements ICustomer {
    public created: string;
    public id: string;
    public firstName: string;
    public lastName: string;
    public email: string;
    public businessName: string;
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
        this.phone = data.phone;
        this.address1 = data.address1;
        this.address2 = data.address2;
        this.type = data.type;
        this.status = data.status;
    }

    public setLocalization(url): ICustomer {
        this.localization = url;
        return this;
    }
}

export const CUSTOMER_STATUS = {
    Personal: 'personal',
    Unverified: 'unverified',
    Verified: 'verified',
    Retry: 'retry',
    Document: 'document',
    Suspended: 'suspended',
    Deactivated: 'deactivated',
};

export const TYPE = {
    Personal: 'personal',
};

export const factory = (data): ICustomer => {
    return new Customer(data);
};

export const factoryFromProfile = (profile: profile.Profile): ICustomer => {
    const data = profile.toJSON();
    data['type'] = TYPE.Personal;

    return new Customer(data);
};
