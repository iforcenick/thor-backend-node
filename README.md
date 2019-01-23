### Installation
* yarn
* yarn install knex -g

### Build
* yarn run build
* yarn run swagger

### Running containers
* build
* yarn run build:docker
* yarn run start:docker-dev
* if run for the first time check ```docker logs thor_api``` and if there are any connection errors run ```docker stop thor_api```
and ```yarn run db``` followed by ```yarn run start:docker-dev```

### Configuring PostgreSQL
* connect to http://localhost:5400/browser/
* login as postgres/qwe123
* add server, connect to thor_db

### Migrations
Migrations are run based on config files from config directory. In order to use proper configuration set NODE_ENV env variable to desired value before running knex, ie. : ```NODE_ENV=development-pawel yarn run db```
* create: knex migrate:make NAME
* seed: knex seed:make NAME
* run seed: knex seed:run
* rollback: knex migrate:rollback

### OpenAPI
* http://localhost:8081/api-docs/

### Secrets
* Install and initialize the gcloud command line tool along with the kubectl command line tool
* Select the desired active project: ```gcloud set project [PROJECT_ID]```
* Get the credentials for the desired cluster: ```gcloud container clusters get-credentials [CLUSTER_NAME]```
* Create a secret from a yaml file: ```kubectl create -f [FILE_NAME].yaml```

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
  
* Updating a secret: ```kubectl apply -f [FILE_NAME].yaml```
* Retrieving a secret: ```kubectl get secret [SECRET_NAME] -o yaml --namespace=[NAMESPACE]```
* Encoding a secret to base 64: ```echo -n '[STRING_TO_ENCODE]' | base64```
* Decoding a secret from base 64: ```echo -n '[STRING_TO_DECODE]' | base64 --decode```

### DevScripts
Dev scripts are run from console. The required program for executing scripts is NodeJS.
 
Dev scripts are stored in path ~/dist/dev/console 
 
List of scripts are below:
* Certify business verified customer :
   * certify-bvc.js {{businessVerifiedCustomerId}}
* Create tenant:
   * create-events.js {{tenantName}} {{tenantEmail}}
      - tenantName can not contain spaces or white space
      - tenantEmail has to be validate email
* Get dwolla events:
   * get-events.js {{limit}} {{offset}}
      - limit can not be greater than 200
      - offset is optional  
* Transfer to Thor:
   * transfer-to-thor.js {{withdrawalFundingSourceId}} {{amount}}
* Verify funding source:
   * verify-fs.js {{fundingSourceId}}
    
 
example usage:
```
node /dist/dev/console create-tenant.js thor godOfThunder@thor.com
```

### Clusters
* Install Helm locally 
   ```
   brew install kubernetes-helm
   ```
* Create the cluster
* Get the credentials for the desired cluster 
   ```
   gcloud container clusters get-credentials [CLUSTER_NAME]
   ```
* Create a global static IP address
   ```
   gcloud compute addresses create [ADDRESS_NAME] --global
   ```
* Install Tiller 
   ```
   kubectl create serviceaccount tiller --namespace=kube-system

   kubectl create clusterrolebinding tiller-admin --serviceaccount=kube-system:tiller --clusterrole=cluster-admin
   
   helm init --service-account=tiller
   
   helm repo update
   ```
* Create a namespace
   ```
   kubectl apply -f [NAMESPACE_YAML]
   ```
* Create the credentials
   ```
   kubectl apply -f [CREDENTIALS_YAML]
   ```
* Deploy the application
   ```
   helm install --values kubernetes/thor-api/values/values-stg.yaml kubernetes/thor-api --set env.DOCKER_REPOSITORY="us.gcr.io/odin-214321/thor-api" --set env.TAG=[TAG_NAME] --name thor-api --namespace thor-api
   ```
* Deploy Cert Manager
   ```
   kubectl apply -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.6/deploy/manifests/00-crds.yaml --namespace=thor-api
   
   helm update repo
   
   helm install --name cert-manager stable/cert-manager --set createCustomResource=false --namespace=thor-api
   ```
* Add Let's Encrypt Issuer
   ```
   kubectl apply -f ./kubernetes/requirements/letsencrypt-issuer.yaml --namespace thor-api
   ```
* Deploy TLS Ingress Resource
   ```
   kubectl apply -f ./kubernetes/requirements/certificate-stg.yaml --namespace thor-api
   ```
* Deploy TLS Certificate
   * ```openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /tmp/tls.key -out /tmp/tls.crt -subj "/CN=odin-api.stg.gothor.com"```
   * ```kubectl create secret tls odin-api-tls --key /tmp/tls.key --cert /tmp/tls.crt --namespace thor-api```
