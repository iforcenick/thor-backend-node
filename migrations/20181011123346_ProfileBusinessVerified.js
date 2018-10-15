const tableName = 'profiles';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.string('businessName');
        t.string('doingBusinessAs');
        t.string('businessType');
        t.string('businessClassification');
        t.string('ein');
        t.string('website');
        t.string('dwollaType');
    });
};
exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.dropColumn('businessName');
        t.dropColumn('doingBusinessAs');
        t.dropColumn('businessType');
        t.dropColumn('businessClassification');
        t.dropColumn('ein');
        t.dropColumn('website');
        t.dropColumn('dwollaType');
    });
};
