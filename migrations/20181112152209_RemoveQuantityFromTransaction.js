const tableName = 'transactions';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.decimal('value', 14, 2).notNullable().defaultTo(1);
        t.dropColumn('quantity');
    });
};

exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.dropColumn('value');
        t.integer('quantity').notNullable().defaultTo(1);
    });
};