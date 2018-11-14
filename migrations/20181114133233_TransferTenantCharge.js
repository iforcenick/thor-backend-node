const tableName = 'transfers';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.string('tenantChargeId');
    });
};

exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.dropColumn('tenantChargeId');
    });
};