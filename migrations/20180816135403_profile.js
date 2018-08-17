const tableName = 'profiles';
exports.up = (knex) => {
    return knex.schema
        .createTable(tableName, (table) => {
            table.uuid('id').primary();
            table.uuid('userId');
            table.uuid('tenantId');
            table.string('phone');
            table.string('name');
            table.string('email');
            table.string('dwollaUri');
            table.string('dwollaSourceUri');
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
exports.down = (knex) => {
    return knex.schema.dropTable(tableName);
};
