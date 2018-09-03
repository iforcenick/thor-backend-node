exports.up = knex => {
    return knex.schema
        .createTable('roles', table => {
            table.uuid('id').primary();
            table.string('name').notNullable();
            table.datetime('createdAt');
            table.datetime('updatedAt');
            table.unique('name')
        })
        .createTable('profilesRoles', table => {
            table.uuid('profileId').index().references('profiles.id').notNullable();
            table.uuid('roleId').index().references('roles.id').notNullable();
            table.unique(['profileId', 'roleId'])

        });
};

exports.down = knex => {
    return knex.schema
        .dropTableIfExists('profilesRoles')
        .dropTableIfExists('roles');
};
