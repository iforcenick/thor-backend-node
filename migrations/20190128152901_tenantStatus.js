const tableName = 'tenants';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.string('status').default('active');
    });
};

exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
      t.dropColumn('status');
    });
};