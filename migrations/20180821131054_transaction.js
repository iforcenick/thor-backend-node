const tableName = 'transactions';
exports.up = (knex) => {
    return knex.schema
        .createTable(tableName, (table) => {
            table.uuid('id').primary();
            table.uuid('userId').index().references('id').inTable('users');
            table.uuid('tenantId').index().references('id').inTable('tenants');
            table.uuid('adminId').index().references('id').inTable('users');
            table.uuid('jobId').index().references('id').inTable('jobs');
            table.uuid('dwollaId');
            table.integer('quantity');
            table.string('status');
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
exports.down = (knex) => {
    return knex.schema.dropTable(tableName);
};
