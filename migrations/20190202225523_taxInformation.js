exports.up = (knex) => {
    return knex.schema
        .table('profiles', (t) => {
            t.renameColumn('dwollaUri', 'paymentsUri');
            t.renameColumn('dwollaStatus', 'paymentsStatus');
            t.renameColumn('dwollaType', 'paymentsType');
            t.dropColumn('dwollaSourceUri');
            t.dropColumn('dwollaRouting');
            t.dropColumn('dwollaAccount');
            t.dropColumn('website');
            t.string('citizenship');
            t.string('ssn');
        })
        .table('fundingSources', (t) => {
            t.renameColumn('dwollaUri', 'paymentsUri');
            t.renameColumn('verificationStatus', 'status');
            t.dropForeign('tenantId');
            t.dropColumn('tenantId');
        })
        .table('tenants', (t) => {
            t.renameColumn('dwollaUri', 'paymentsUri');
            t.renameColumn('dwollaType', 'paymentsType');
            t.renameColumn('dwollaStatus', 'paymentsStatus');
            t.renameColumn('fundingSourceVerificationStatus', 'fundingSourceStatus');
            t.string('ein');
        })
        .table('transfers', (t) => {
            t.renameColumn('externalId', 'paymentsUri');
        })
        .renameTable('userDocuments', 'documents');
};

exports.down = (knex) => {
    return knex.schema
    .table('profiles', (t) => {
        t.renameColumn('paymentsUri', 'dwollaUri');
        t.renameColumn('paymentsType', 'dwollaType');
        t.renameColumn('paymentsStatus', 'dwollaStatus');
        t.string('dwollaSourceUri');
        t.string('dwollaRouting');
        t.string('dwollaAccount');
        t.string('website');
        t.dropColumn('citizenship');
        t.dropColumn('ssn');
    })
    .table('fundingSources', (t) => {
        t.renameColumn('paymentsUri', 'dwollaUri');
        t.renameColumn('status', 'verificationStatus');
        t.uuid('tenantId').index().references('id').inTable('tenants');
    })
    .table('tenants', (t) => {
        t.renameColumn('paymentsUri', 'dwollaUri');
        t.renameColumn('paymentsType', 'dwollaType');
        t.renameColumn('paymentsStatus', 'dwollaStatus');
        t.renameColumn('fundingSourceStatus', 'fundingSourceVerificationStatus');
        t.dropColumn('ein');
    })
    .table('transfers', (t) => {
        t.renameColumn('paymentsUri', 'externalId');
    })
    .renameTable('documents', 'userDocuments');
};