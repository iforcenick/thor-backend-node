const tableName = 'tenants';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.string('fundingSourceUri');
        t.string('fundingSourceRouting');
        t.string('fundingSourceAccount');
        t.string('fundingSourceName');
    });
};

exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.dropColumn('fundingSourceUri');
        t.dropColumn('fundingSourceRouting');
        t.dropColumn('fundingSourceAccount');
        t.dropColumn('fundingSourceName');
    });
};