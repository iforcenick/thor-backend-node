const tableName = 'jobs';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.boolean('isCustom').notNullable().defaultTo(false);
    });
};

exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.dropColumn('isCustom');
    });
};