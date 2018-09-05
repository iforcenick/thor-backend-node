const tableName = 'transactions';
exports.up = knex => {
    return knex.schema.createTable(tableName, table => {
        table.uuid('id').primary();
        table
            .uuid('userId')
            .index()
            .references('id')
            .inTable('users')
            .notNullable();
        table
            .uuid('tenantId')
            .index()
            .references('id')
            .inTable('tenants')
            .notNullable();
        table
            .uuid('adminId')
            .index()
            .references('id')
            .inTable('users')
            .notNullable();
        table
            .uuid('jobId')
            .index()
            .references('id')
            .inTable('jobs')
            .notNullable();
        table
            .uuid('transferId')
            .index()
            .references('id')
            .inTable('transfers');
        table.integer('quantity').notNullable();
        table.string('status').notNullable();
        table.string('location');
        table.datetime('createdAt');
        table.datetime('updatedAt');
    });
};
exports.down = knex => {
    return knex.schema.dropTable(tableName);
};
