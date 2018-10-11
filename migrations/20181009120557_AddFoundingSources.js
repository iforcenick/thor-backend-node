exports.up = (knex) => {
    return knex.schema
        .createTable('fundingSources', (table) => {
            table.uuid('id').primary();
            table.uuid('tenantId').index().references('id').inTable('tenants').notNullable();
            table.uuid('profileId').index().references('id').inTable('profiles').notNullable();
            table.string('dwollaUri').notNullable();
            table.string('name').notNullable();
            table.string('type').notNullable();
            table.string('account').notNullable();
            table.string('routing').notNullable();
            table.boolean('isDefault').notNullable().defaultTo(false);
            table.datetime('createdAt');
            table.datetime('updatedAt');
        })
        .createTable('profilesFundingSources', table => {
            table.uuid('profileId').index().references('profiles.id').notNullable();
            table.uuid('fundingSourceId').index().references('fundingSources.id').notNullable();
            table.unique(['profileId', 'fundingSourceId'])
        });
};

exports.down = (knex) => {
    return knex.schema
        .dropTableIfExists('profilesFundingSources')
        .dropTableIfExists('fundingSources');
};
