const tableName = 'users';
exports.up = (knex) => {
    return knex.schema.table(tableName, (t) => {
        t.string('passwordResetToken');
        t.string('passwordResetExpiry');
    });
};
exports.down = (knex) => {
    return knex.schema.table(tableName, function(t) {
        t.dropColumn('passwordResetToken');
        t.dropColumn('passwordResetExpiry');
    });
};
