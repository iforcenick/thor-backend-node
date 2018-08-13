
exports.seed = (knex) => {
  return knex('roles').del()
    .then(function () {
      return knex('roles').insert([
          {id: 1, name: 'admin'},
          {id: 2, name: 'customer'},
      ]);
    });
};
