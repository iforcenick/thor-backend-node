const tableName = 'tenants';
exports.up = (knex) => {
    return knex.schema
        .createTable(tableName, (table) => {
            table.uuid('id').primary();
            table.string('name').notNullable();
            table.string('dwollaUri');
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
exports.down = (knex) => {
    return knex.schema.dropTable(tableName);
};
