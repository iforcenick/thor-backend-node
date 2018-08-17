exports.up = (knex) => {
    return knex.schema
        .createTable('roles', (table) => {
            table.increments('id').primary();
            table.string('name');
            table.datetime('createdAt');
            table.datetime('updatedAt');
        })
        .createTable('profilesRoles', (table) => {
            table.uuid('profileId');
            table.integer('roleId');
        });
};

exports.down = (knex) => {
    return knex.schema
        .dropTableIfExists('roles')
        .dropTableIfExists('profilesRoles');
};
