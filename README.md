### Installation
* npm i
* npm install knex -g

### Build
* npm run build
* npm run swagger

### Running containers
* build
* npm run build:docker
* npm run start:docker-dev

### Configuring PostgreSQL
* connect to http://localhost:5400/browser/
* login as postgres/qwe123
* create db for environment (so development for dev, default for others for now)

### Migrations
* create: knex migrate:make NAME
* seed: knex seed:make NAME
* run seed: knex seed:run

### OpenAPI
* http://localhost:8081/api-docs/