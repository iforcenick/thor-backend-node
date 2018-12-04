const fundingSourcesTableName = 'fundingSources';
const tenantsTableName = 'tenants';
exports.up = (knex) => {
    return knex.schema.table(fundingSourcesTableName, (t) => {
        t.dropColumn('account');
        t.dropColumn('routing');
    }).table(tenantsTableName, (t) => {
        t.dropColumn('fundingSourceAccount');
        t.dropColumn('fundingSourceRouting');
    });
};

exports.down = (knex) => {
    return knex.schema.table(fundingSourcesTableName, (t) => {
        t.string('account');
        t.string('routing');
    }).table(tenantsTableName, (t) => {
        t.string('fundingSourceRouting');
        t.string('fundingSourceAccount');
    });
};
