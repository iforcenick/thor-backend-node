const tableName = 'tenants';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.jsonb('settings');
    });
};

exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
      t.jsonb('settings');
    });
};