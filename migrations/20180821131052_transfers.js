const tableName = 'transfers';
exports.up = (knex) => {
    return knex.schema
        .createTable(tableName, (table) => {
            table.uuid('id').primary();
            table.uuid('adminId').index().references('id').inTable('users').notNullable();
            table.string('externalId');
            table.string('sourceUri');
            table.string('destinationUri');
            table.string('meta');
            table.decimal('value', 14, 2).notNullable();
            table.string('status').notNullable();
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
exports.down = (knex) => {
    return knex.schema.dropTable(tableName);
};
