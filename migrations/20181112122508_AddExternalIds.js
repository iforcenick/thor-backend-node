exports.up = function(knex, Promise) {
  return knex.schema
      .table('contractorInvitations', function(table) {
          table.string('externalId');
      })
      .table('profiles', function(table) {
            table.string('externalId');
      });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .table('contractorInvitations', function(table) {
            table.dropColumn('externalId');
        })
        .table('profiles', function(table) {
            table.dropColumn('externalId');
        });
};
