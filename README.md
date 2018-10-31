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
* if run for the first time check ```docker logs thor_api``` and if there are any connection errors run ```docker stop thor_api```
and ```npm run db``` followed by ```npm run start:docker-dev```

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

### Secrets
* Install and initialize the gcloud command line tool along with the kubectl command line tool
* Select the desired active project ```gcloud set project [PROJECT_ID]```
* Get the credentials for the desired cluster ```gcloud container clusters get-credentials [CLUSTER_NAME]```
* Create a secret from a yaml file
  ```sh
  kubectl create -f [FILE_NAME].yaml
  ```

  Here is an example yaml file:
  ```yaml
  apiVersion: v1
  kind: Secret
  metadata:
    name: credentials
    namespace: thor-api
  data:
    dwolla_key: XXXXXXXXXXX
    dwolla_secret: XXXXXXXXXXX
    dwolla_webhookSecret: XXXXXXXXXXX
    mailer_mailgun_domain: XXXXXXXXXXX
    mailer_mailgun_key: XXXXXXXXXXX
  ```
  Where the data field is a map. Its keys must consist of alphanumeric characters, ‘-’, ‘_’ or ‘.’. The values are arbitrary data, encoded using base64.
* Updating a secret
  ```sh
  kubectl apply -f [FILE_NAME].yaml
  ```
* Retrieving a secret
  ```sh
  kubectl get secret [SECRET_NAME] -o yaml --namespace=[NAMESPACE]
  ```

 