exports.seed = function(knex, Promise) {
    // Deletes ALL existing entries
    return knex('tenants')
        .del()
        .then(function() {
            // Inserts seed entries
            return knex('tenants').insert([
                {
                    id: '7bc0447a-ea99-4ba2-93bb-c84f5b325c50',
                    name: 'Super Admin',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        });
};
