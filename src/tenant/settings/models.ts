export class BillingSettings {
    payPeriod: string = 'monthly';
    contractorLimit: number = 50;
    pricePerContractor: number = 15;
}

export class JobSettings {
    allowCustomJobs: boolean = true;
}

export class Settings {
    billing: BillingSettings = new BillingSettings();
    jobs: JobSettings = new JobSettings();

    constructor(settings: any = {}) {
        Object.assign(this, settings);
    }
}