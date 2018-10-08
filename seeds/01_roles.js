
exports.seed = (knex) => {
  return knex('roles').del()
    .then(function () {
      return knex('roles').insert([
          {id: '9ccb854d-d645-475b-a9e0-57c0609762c8', name: 'admin'},
          {id: '3c7b493b-ce18-4e50-8edc-01664f455a20', name: 'contractor'},
      ]);
    });
};
