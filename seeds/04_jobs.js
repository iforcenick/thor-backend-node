exports.seed = function (knex, Promise) {
    // Deletes ALL existing entries
    return knex('jobs').del()
        .then(function () {
            // Inserts seed entries
            return knex('jobs').insert([
                {
                    id: '7a68ab86-4e92-4722-b42a-06e10d0c2afb',
                    value: 3.13,
                    name: 'Cleaning',
                    description: 'Easy job',
                    tenantId: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '29676a97-deab-42f6-b4ae-91f6ea87f4d1',
                    value: 5.23,
                    name: 'Vacuuming',
                    description: 'Medium job',
                    tenantId: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },

                {
                    id: '3cba79fb-13fa-4d78-a083-dcef030ebb4d',
                    value: 45.99,
                    name: 'Washing',
                    description: 'Harder job',
                    tenantId: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'a5879b31-d1cd-4ffe-8997-d4ae2b7b21fd',
                    value: 10040.69,
                    name: 'Waxing',
                    description: 'Hard job',
                    tenantId: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '3a7ba345-19b5-4951-a833-b5874b84a6c4',
                    value: 6666666.66,
                    name: 'Hacking DevTenant',
                    description: 'Imposible job',
                    tenantId: '8e1be740-2152-467b-9c9b-be6dac16e9e1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        });
};
