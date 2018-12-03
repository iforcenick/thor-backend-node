const transfers = 'transfers';

exports.up = (knex) => {
    return knex.schema
      .table(transfers, function(table) {
          table.uuid('tenantId').references('tenants.id');
      });
};

exports.down = (knex) => {
    return knex.schema
        .table(transfers, function(table) {
            table.dropColumn('tenantId');
        });
};