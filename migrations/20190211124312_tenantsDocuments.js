exports.up = knex => {
    return knex.schema
        .dropTable('documents')
        .createTable('documents', t => {
            t.uuid('id').primary();
            t.uuid('tenantId').index().references('id').inTable('tenants').notNullable();
            t.string('name').notNullable();
            t.string('description');
            t.string('fileName').notNullable();
            t.boolean('isRequired').defaultTo(true);
            t.datetime('createdAt');
            t.datetime('updatedAt');
            t.datetime('deletedAt');
        })
        .createTable('usersDocuments', t => {
            t.uuid('id').primary();
            t.uuid('userId').index().references('id').inTable('users').notNullable();
            t.uuid('tenantId').references('id').inTable('tenants').notNullable();
            t.uuid('documentId').index().references('id').inTable('documents');
            t.string('status').notNullable();
            t.string('fileName').notNullable();
            t.datetime('createdAt');
            t.datetime('updatedAt');
            t.datetime('deletedAt');
            t.unique(['userId', 'documentId']);
        });
};

exports.down = knex => {
    return knex.schema
        .dropTable('usersDocuments')
        .dropTable('documents')
        .createTable('documents', table => {
            table.uuid('id').primary();
            table.uuid('userId').index().references('id').inTable('users').notNullable();
            table.uuid('tenantId').references('id').inTable('tenants');
            table.string('name');
            table.string('type');
            table.datetime('createdAt');
            table.datetime('updatedAt');
        });
};
