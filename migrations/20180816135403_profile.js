const tableName = 'profiles';
exports.up = (knex) => {
    return knex.schema
        .createTable(tableName, (table) => {
            table.uuid('id').primary();
            table.uuid('userId');
            table.uuid('tenantId');
            table.string('firstName');
            table.string('lastName');
            table.string('email');
            table.string('phone');
            table.string('country');
            table.string('state');
            table.string('city');
            table.string('postalCode');
            table.string('address1');
            table.string('address2');
            table.string('dateOfBirth');
            table.string('dwollaUri');
            table.string('dwollaSourceUri');
            table.string('dwollaStatus');
            table.string('dwollaRouting');
            table.string('dwollaAccount');
            table.datetime('createdAt');
            table.datetime('updatedAt');

            table.foreign('userId').references('users.id');
            table.foreign('tenantId').references('tenants.id');
        });
};
exports.down = (knex) => {
    return knex.schema.dropTable(tableName);
};
