const tableName = 'userDocuments';
exports.up = knex => {
    return knex.schema.createTable(tableName, table => {
        table.uuid('id').primary();
        table
            .uuid('userId')
            .index()
            .references('users.id')
            .notNullable();
        table.uuid('tenantId').references('tenants.id');
        table.string('name');
        table.string('type');
        table.datetime('createdAt');
        table.datetime('updatedAt');
    });
};

exports.down = knex => {
    return knex.schema.dropTable(tableName);
};
