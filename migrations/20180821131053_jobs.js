const tableName = 'jobs';
exports.up = (knex) => {
    return knex.schema
        .createTable(tableName, (table) => {
            table.uuid('id').primary();
            table.uuid('tenantId').index().references('id').inTable('tenants').notNullable();
            table.decimal('value', 14, 2).notNullable();
            table.string('name').notNullable();
            table.string('description');
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
exports.down = (knex) => {
    return knex.schema.dropTable(tableName);
};
