exports.seed = function (knex, Promise) {
    return knex('users')
        .insert([
            {
                id: '8251efb9-18b5-476e-a2a0-27e38a4da751',
                password: '$2b$10$TscOBpPG51MVLUtsmTkMnuOsdxMKGOHVUnj4kwmyI2ldF5uerGxx2', // 123
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            },
            {
                id: 'ff7de419-ba88-4042-baeb-399d0675e9b4',
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
                    deletedAt: null,
                },
                {
                    id: '00af4d03-f068-4ff1-9c3c-08534406c7ac',
                    userId: 'ff7de419-ba88-4042-baeb-399d0675e9b4',
                    firstName: 'Contr',
                    lastName: 'Actor',
                    phone: '666666666',
                    email: 'test_contractor@test.pl',
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
                    deletedAt: null,
                },
                {
                    id: '39f01440-b79b-4f16-a8c1-f918a18ffa16',
                    userId: 'ff7de419-ba88-4042-baeb-399d0675e9b4',
                    tenantId: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
                    firstName: 'Contr',
                    lastName: 'Actor',
                    phone: '678943434',
                    email: 'test_contractor@test.pl',
                    dwollaUri: 'https://api-sandbox.dwolla.com/customers/4c2a6459-257a-4510-8365-d1568da4b6a4',
                    dwollaSourceUri: 'https://api-sandbox.dwolla.com/funding-sources/69fe477c-21ce-440e-a28c-b8f8781cde81',
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
                {
                    profileId: '39f01440-b79b-4f16-a8c1-f918a18ffa16',
                    roleId: '3c7b493b-ce18-4e50-8edc-01664f455a20',
                },
            ]);
        });
};
