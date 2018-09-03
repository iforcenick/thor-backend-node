const tableName = 'profiles';
exports.up = knex => {
    return knex.schema.createTable(tableName, table => {
        table.uuid('id').primary();
        table.uuid('userId').index().references('users.id').notNullable();
        table.uuid('tenantId').references('tenants.id');
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
        table.datetime('deletedAt');

        table.unique(['userId', 'tenantId'])

    });
};
exports.down = knex => {
    return knex.schema.dropTable(tableName);
};
