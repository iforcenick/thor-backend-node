exports.seed = (knex, Promise) => {
    // Deletes ALL existing entries
    return knex('users').del()
        .then(() => {
            // Inserts seed entries
            return knex('users').insert([
                {
                    id: '8251efb9-18b5-476e-a2a0-27e38a4da750',
                    password: '$2b$10$TscOBpPG51MVLUtsmTkMnuOsdxMKGOHVUnj4kwmyI2ldF5uerGxx2', // 123
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            ]).then(() => {
                return knex('profiles').insert([
                    {
                        id: '7f11b5b2-c9f8-4e3f-920d-0248daaa216e',
                        userId: '8251efb9-18b5-476e-a2a0-27e38a4da750',
                        tenantId: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
                        firstName: 'Super',
                        lastName: 'Admin',
                        phone: '6666666',
                        email: 'superadmin@test.com',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }
                ])
            }).then(() => {
                return knex('profilesRoles').insert([
                    {
                        profileId: '7f11b5b2-c9f8-4e3f-920d-0248daaa216e',
                        roleId: '9ccb854d-d645-475b-a9e0-57c0609762c8',
                    }
                ])
            });
        });
};
