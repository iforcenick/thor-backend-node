const tableName = 'jobs';
exports.up = (knex) => {
    return knex.schema
        .createTable(tableName, (table) => {
            table.uuid('id').primary();
            table.uuid('tenantId').index().references('id').inTable('tenants');
            table.decimal('value', 14, 2);
            table.string('name');
            table.string('description');
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
exports.down = (knex) => {
    return knex.schema.dropTable(tableName);
};
