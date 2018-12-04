const fundingSourcesTableName = 'fundingSources';
const tenantsTableName = 'tenants';
exports.up = (knex) => {
    return knex.schema.table(fundingSourcesTableName, (t) => {
        t.dropColumn('account');
        t.dropColumn('routing');
        t.dropColumn('name');
    }).table(tenantsTableName, (t) => {
        t.dropColumn('fundingSourceName');
        t.dropColumn('fundingSourceAccount');
        t.dropColumn('fundingSourceRouting');
    });
};

exports.down = (knex) => {
    return knex.schema.table(fundingSourcesTableName, (t) => {
        t.string('account');
        t.string('routing');
        t.string('name');
    }).table(tenantsTableName, (t) => {
        t.string('fundingSourceName');
        t.string('fundingSourceRouting');
        t.string('fundingSourceAccount');
    });
};
