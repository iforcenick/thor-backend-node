
exports.up = (knex) => {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('phone');
      table.string('name');
      table.string('email');
      table.string('password');
      table.date('createdAt');
      table.date('updatedAt');
    });
};

exports.down = (knex) => {
  return knex.schema.dropTable('users');
};
