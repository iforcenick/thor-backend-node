const typescript_ioc_1 = require("typescript-ioc");
const config_1 = require("./dist/config");
const config = typescript_ioc_1.Container.get(config_1.Config);
const connection = config.get('db.connection');
const pool = config.get('db.pool');

const defaultConfig = {
    client: 'postgresql',
    connection: connection,
    pool: pool,
    migrations: {
        tableName: 'knex_migrations'
    }
};

console.log('Using config: ', defaultConfig);

module.exports = defaultConfig;
