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
* if run for the first time check ```doker logs thor_api``` and if there are any connection errors run ```docker stop thor_api```
and ```npm run start:docker-dev```

### Configuring PostgreSQL
* connect to http://localhost:5400/browser/
* login as postgres/qwe123
* add server, connect to thor_db

### Migrations
* create: knex migrate:make NAME
* seed: knex seed:make NAME
* run seed: knex seed:run

### OpenAPI
* http://localhost:8081/api-docs/