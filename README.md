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

### Deploy to Cluster
* Commit the build to the branch
* Find the version tag in Google Container Repository
* Get the credentials for the desired cluster
   ```
   gcloud container clusters get-credentials ${CLUSTER_NAME}
   ```
* Push the image to the cluster
   ```
   helm upgrade --values ${VALUES_FILE} thor-api kubernetes/thor-api --set env.DOCKER_REPOSITORY="us.gcr.io/odin-214321/thor-api" --set env.TAG=${BUILD_TAG} --wait --timeout 600
   ```

### Creating Clusters
* Install gcloud CLI tools
* Install Helm locally 
   ```
   brew install kubernetes-helm
   ```
* Select the project
   ```
   gcloud set project ${PROJECT_ID}
   ```
* Create the cluster
   ```
   gcloud container clusters create ${CLUSTER_NAME} \
    --preemptible \
    --zone us-west1-a \
    --scopes cloud-platform \
    --enable-autorepair \
    --enable-autoscaling --min-nodes 1 --max-nodes 10 \
    --num-nodes 1
   ```
* Get the credentials for the desired cluster 
   ```
   gcloud container clusters get-credentials ${CLUSTER_NAME}
   ```
* Create a global static IP address
   ```
   gcloud compute addresses create ${STATIC_ADDRESS_NAME} --global
   ```
* Add IP address to your domain DNS
* Install Tiller on Cluster 
   ```
   kubectl create serviceaccount tiller --namespace=kube-system

   kubectl create clusterrolebinding tiller-admin --serviceaccount=kube-system:tiller --clusterrole=cluster-admin
   
   helm init --service-account=tiller
   
   helm repo update
   ```
* Create a namespace
   ```
   kubectl apply -f ./kubernetes/requirements/namespace.yaml
   ```
* Create the credentials

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
      db_connection_host: XXXXXXXXXXXX
      db_connection_password: XXXXXXXXXXXX
   ```
   *Where the data field is a map. Its keys must consist of alphanumeric characters, ‘-’, ‘_’ or ‘.’. The values are arbitrary data, encoded using base64.*
   * Creating/updating a secret: ```kubectl apply -f ${CREDENTIALS_YAML}```
   * Retrieving a secret: ```kubectl get secret ${SECRET_NAME} -o yaml --namespace=thor-api```
   * Encoding a secret to base 64: ```echo -n '${STRING_TO_ENCODE}' | base64```
   * Decoding a secret from base 64: ```echo -n '${STRING_TO_DECODE}' | base64 --decode```
* Deploy the storage key
   * Create a new service account with storage admin access using the Google Cloud Console
   * Download the json key file
   ```
   kubectl create secret generic storage-key --from-file=key.json=${KEY_FILE} --namespace thor-api
   ```
* Deploy the application
   ```
   helm install --values ${VALUES_FILE} kubernetes/thor-api --set env.DOCKER_REPOSITORY="us.gcr.io/odin-214321/thor-api" --set env.TAG=${BUILD_TAG} --name thor-api --namespace thor-api
   ```
   *Initially set the ingress->enabled key to false*
* Deploy Cert Manager
   ```
   kubectl apply -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.6/deploy/manifests/00-crds.yaml --namespace=thor-api
   
   helm update repo
   
   helm install --name cert-manager stable/cert-manager --namespace=thor-api
   ```
* Add Let's Encrypt Issuers
   ```
   kubectl apply -f ./kubernetes/requirements/production-issuer.yaml --namespace thor-api

   kubectl apply -f ./kubernetes/requirements/staging-issuer.yaml --namespace thor-api
   ```
* Deploy TLS Ingress Resource
   ```
   kubectl apply -f ${CERTIFICATE_YAML} --namespace thor-api
   ```
   *Note: change the issuer reference to 'letsencrypt-staging' for testing*
* Add Jenkins Access

   *TODO*

