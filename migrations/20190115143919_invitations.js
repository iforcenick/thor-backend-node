const tableName = 'invitations';
exports.up = (knex) => {
    return knex.schema
        .dropTable('contractorInvitations')
        .createTable(tableName, (table) => {
            table.uuid('id').primary();
            table.uuid('tenantId').index().references('id').inTable('tenants').notNullable();
            table.uuid('userId').index().references('users.id').notNullable();
            table.string('email').notNullable();
            table.string('status').notNullable();
            table.string('type').notNullable();
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
exports.down = (knex) => {
    return knex.schema
        .dropTable(tableName)
        .createTable('contractorInvitations', (table) => {
            table.uuid('id').primary();
            table.uuid('tenantId').index().references('id').inTable('tenants').notNullable();
            table.string('email').notNullable();
            table.string('status').notNullable();
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
