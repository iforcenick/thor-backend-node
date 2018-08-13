// Update with your config settings.
//TODO: load from config
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      database: 'development',
      user:     'postgres',
      password: 'qwe123'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};
