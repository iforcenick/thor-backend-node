const tableName = 'fundingSources';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.string('verificationStatus');
    });
};

exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.dropColumn('verificationStatus');
    });
};