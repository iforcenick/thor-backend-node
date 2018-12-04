const tableName = 'jobs';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.boolean('isActive').notNullable().defaultTo(true);
    });
};

exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.dropColumn('isActive');
    });
};