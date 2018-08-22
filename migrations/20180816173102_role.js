exports.up = knex => {
    return knex.schema
        .createTable('roles', table => {
            table.uuid('id').primary();
            table.string('name');
            table.datetime('createdAt');
            table.datetime('updatedAt');
        })
        .createTable('profilesRoles', table => {
            table.uuid('profileId');
            table.uuid('roleId');
            table.foreign('profileId').references('profiles.id');
            table.foreign('roleId').references('roles.id');
        });
};

exports.down = knex => {
    return knex.schema
        .dropTableIfExists('profilesRoles')
        .dropTableIfExists('roles');
};
