exports.seed = function (knex, Promise) {
    return knex('users')
        .insert([
            {
                id: '8251efb9-18b5-476e-a2a0-27e38a4da751',
                password: '$2b$10$TscOBpPG51MVLUtsmTkMnuOsdxMKGOHVUnj4kwmyI2ldF5uerGxx2', // 123
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ])
        .then(() => {
            return knex('profiles').insert([
                {
                    id: '1f11b5b2-c9f8-4e3f-920d-0248daaa216e',
                    userId: '8251efb9-18b5-476e-a2a0-27e38a4da751',
                    firstName: 'Contr',
                    lastName: 'Actor',
                    phone: '678943434',
                    email: 'contr@ct.or',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        })
        .then(() => {
            return knex('profiles').insert([
                {
                    id: '2f11b5b2-c9f8-4e3f-920d-0248daaa216e',
                    userId: '8251efb9-18b5-476e-a2a0-27e38a4da751',
                    tenantId: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
                    firstName: 'Contr',
                    lastName: 'Actor',
                    phone: '678943434',
                    email: 'contr@ct.or',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        })
        .then(() => {
            return knex('profilesRoles').insert([
                {
                    profileId: '1f11b5b2-c9f8-4e3f-920d-0248daaa216e',
                    roleId: '3c7b493b-ce18-4e50-8edc-01664f455a20',
                },
            ]);
        });
};
