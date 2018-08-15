exports.up = (knex) => {
    return knex.schema
        .createTable('roles', (table) => {
            table.increments('id').primary();
            table.string('name');
            table.datetime('createdAt');
            table.datetime('updatedAt');
        })
        .createTable('users_roles', (table) => {
            table.uuid('userId');
            table.integer('roleId');
        });
};

exports.down = (knex) => {
    return knex.schema
        .dropTableIfExists('roles')
        .dropTableIfExists('users_roles');
};
