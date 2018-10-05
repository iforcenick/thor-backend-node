const tableName = 'contractorInvitations';
exports.up = (knex) => {
    return knex.schema
        .createTable(tableName, (table) => {
            table.uuid('id').primary();
            table.uuid('tenantId').index().references('id').inTable('tenants').notNullable();
            table.string('email').notNullable();
            table.string('status').notNullable();
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
exports.down = (knex) => {
    return knex.schema.dropTable(tableName);
};
