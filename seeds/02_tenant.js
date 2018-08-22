exports.seed = function (knex, Promise) {
    // Deletes ALL existing entries
    return knex('tenants').del()
        .then(function () {
            // Inserts seed entries
            return knex('tenants').insert([
                {
                    id: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
                    name: 'DevTenant',
                    dwollaUri: 'https://api-sandbox.dwolla.com/funding-sources/24a53f09-99ae-420d-8adc-2793845714b6',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '8e1be740-2152-467b-9c9b-be6dac16e9e1',
                    name: 'EvilTenant',
                    dwollaUri: 'https://api-sandbox.dwolla.com/funding-sources/24a53f09-99ae-420d-8adc-2793845714b6',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        });
};