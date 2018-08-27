const tableName = 'ranks';
exports.up = knex => {
    return knex.schema.createTable(tableName, table => {
        table.uuid('userId');
        table.uuid('tenantId');
        table.decimal('rank', null);
        table.date('date');
        table.datetime('createdAt');
        table.datetime('updatedAt');
        table.datetime('deletedAt');
        table.foreign('userId').references('users.id');
        table.foreign('tenantId').references('tenants.id');
    });
};
exports.down = knex => {
    return knex.schema.dropTable(tableName);
};
