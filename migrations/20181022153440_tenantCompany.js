const tableName = 'tenants';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.string('dwollaType');
        t.string('dwollaStatus');
        t.string('firstName');
        t.string('lastName');
        t.string('phone');
        t.string('email');
        t.string('country');
        t.string('state');
        t.string('city');
        t.string('postalCode');
        t.string('address1');
        t.string('address2');
        t.string('businessName');
        t.string('doingBusinessAs');
        t.string('businessType');
        t.string('businessClassification');
        t.string('website');
    });
};
exports.down = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.dropColumn('dwollaType');
        t.dropColumn('dwollaStatus');
        t.dropColumn('firstName');
        t.dropColumn('lastName');
        t.dropColumn('phone');
        t.dropColumn('email');
        t.dropColumn('country');
        t.dropColumn('state');
        t.dropColumn('city');
        t.dropColumn('postalCode');
        t.dropColumn('address1');
        t.dropColumn('address2');
        t.dropColumn('businessName');
        t.dropColumn('doingBusinessAs');
        t.dropColumn('businessType');
        t.dropColumn('businessClassification');
        t.dropColumn('website');
    });
};
