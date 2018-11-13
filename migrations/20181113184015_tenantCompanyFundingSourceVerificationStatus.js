const tableName = 'tenants';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.string('fundingSourceVerificationStatus');
    });
};

exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.dropColumn('fundingSourceVerificationStatus');
    });
};