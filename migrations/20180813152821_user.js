
exports.up = (knex) => {
  return knex.schema
    .createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('phone');
      table.string('name');
      table.string('email');
      table.string('password');
      table.datetime('createdAt');
      table.datetime('updatedAt');
    });
};

exports.down = (knex) => {
  return knex.schema.dropTable('users');
};
