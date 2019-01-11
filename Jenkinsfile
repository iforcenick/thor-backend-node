#!groovy

properties(
        [[$class  : 'BuildDiscarderProperty',
          strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '15', artifactNumToKeepStr: '15', daysToKeepStr: '15', numToKeepStr: '15']]])

def SERVICE_NAME = "thor-api"
def APP_CONTAINER_NAME = "thor-api-app"
def NAMESPACE = "thor-api"
def DOCKER_REPOSITORY = "us.gcr.io/odin-214321/thor-api"
def GCR_CREDENTIALS = "odin-214321"
def PROD_BRANCH = "prod"
def GCR_URL = "https://us.gcr.io"
def PROD_SERVICE_ACCOUNT = "jenkins-thor-deployer@odin-214321.iam.gserviceaccount.com"
def PROD_SERVICE_ACCOUNT_KEY = "thor-dev-service-account-key"
def PROD_GCP_PROJECT = "odin-214321"
def PROD_CLUSTER_NAME = "thor-prod"
def PROD_ZONE = "us-west1-a"
def DEV_BRANCH = "devops"
def DEV_SERVICE_ACCOUNT = "jenkins-thor-deployer@odin-214321.iam.gserviceaccount.com"
def DEV_SERVICE_ACCOUNT_KEY = "thor-dev-service-account-key"
def DEV_GCP_PROJECT = "odin-214321"
def DEV_CLUSTER_NAME = "thor-dev"
def DEV_ZONE = "us-west1-a"
def STG_BRANCH = "stage"
def STG_SERVICE_ACCOUNT = "jenkins-thor-deployer@odin-214321.iam.gserviceaccount.com"
def STG_SERVICE_ACCOUNT_KEY = "thor-dev-service-account-key"
def STG_GCP_PROJECT = "odin-214321"
def STG_CLUSTER_NAME = "thor-stg"
def STG_ZONE = "us-west1-a"


node('docker') {
    def version = ''
    def errorMessage = ''

    try {
        stage('Clear workspace') {
            deleteDir()
        }

        stage('Checkout') {
            retry(3) {
                checkout scm
            }
            version = sh returnStdout: true, script: 'git describe --long --dirty --abbrev=10 --tags --always'
            version = env.BRANCH_NAME + "-" + version.replaceAll("\\s+", "")
            echo "Version: ${version}"
        }

        stage('Install packages') {
            dir("./") {
                docker.image("node:carbon").inside('') {
                    sh 'yarn install'
                }
            }
        }

        stage('Test') {
            dir("./") {
                docker.image("node:carbon").inside('') {
                    sh 'yarn run test'
                }
            }
        }

        stage('Build modules') {
            dir("./") {
                docker.image("node:carbon").inside('') {
                    sh 'yarn run build'
                    sh 'yarn run swagger'
                }
            }
        }

        stage('Build image') {
            if (env.BRANCH_NAME != DEV_BRANCH && env.BRANCH_NAME != STG_BRANCH && env.BRANCH_NAME != PROD_BRANCH) {
                echo "Skipping. Runs only for ${DEV_BRANCH}, ${STG_BRANCH} and ${PROD_BRANCH} branches"
                return;
            }
            sh "docker build -t ${DOCKER_REPOSITORY}:${version} ."
        }

        stage('Push image') {
            if (env.BRANCH_NAME != DEV_BRANCH && env.BRANCH_NAME != STG_BRANCH && env.BRANCH_NAME != PROD_BRANCH) {
                echo "Skipping. Runs only for ${DEV_BRANCH}, ${STG_BRANCH} and ${PROD_BRANCH} branches"
                return;
            }
            docker.withRegistry("${GCR_URL}", "gcr:${GCR_CREDENTIALS}") {
                sh "docker push ${DOCKER_REPOSITORY}:${version}"
            }
        }

        stage('Deploy') {
			if (env.BRANCH_NAME == DEV_BRANCH) {
				echo "Deploy to dev"
                withCredentials([file(credentialsId: DEV_SERVICE_ACCOUNT_KEY, variable: 'KEY_FILE')]) {
                    docker.withRegistry("${GCR_URL}", "gcr:${GCR_CREDENTIALS}") {
                        docker.image('us.gcr.io/odin-214321/jenkins-deployer:0.1.0').inside("-u root") {
                            sh "/root/google-cloud-sdk/bin/gcloud auth activate-service-account ${DEV_SERVICE_ACCOUNT} --key-file=${KEY_FILE}"
                            sh "/root/google-cloud-sdk/bin/gcloud container clusters get-credentials ${DEV_CLUSTER_NAME} --zone ${DEV_ZONE} --project ${DEV_GCP_PROJECT}"
                            retry(3) {
                                sh "helm upgrade --values kubernetes/thor-api/values/values-dev.yaml thor-api kubernetes/thor-api --set env.DOCKER_REPOSITORY=${DOCKER_REPOSITORY} --set env.TAG=${version} --wait --timeout 600"
                            }
                        }
                    }
                }
				return;
			}

            if (env.BRANCH_NAME == STG_BRANCH) {
				echo "Deploy to stage"
                withCredentials([file(credentialsId: STG_SERVICE_ACCOUNT_KEY, variable: 'KEY_FILE')]) {
                    docker.withRegistry("${GCR_URL}", "gcr:${GCR_CREDENTIALS}") {
                        docker.image('us.gcr.io/odin-214321/jenkins-deployer:0.1.0').inside("-u root") {
                            sh "/root/google-cloud-sdk/bin/gcloud auth activate-service-account ${STG_SERVICE_ACCOUNT} --key-file=${KEY_FILE}"
                            sh "/root/google-cloud-sdk/bin/gcloud container clusters get-credentials ${STG_CLUSTER_NAME} --zone ${STG_ZONE} --project ${STG_GCP_PROJECT}"
                            retry(3) {
                                sh "helm upgrade --values kubernetes/thor-api/values/values-stg.yaml thor-api kubernetes/thor-api --set env.DOCKER_REPOSITORY=${DOCKER_REPOSITORY} --set env.TAG=${version} --wait --timeout 600"
                            }
                        }
                    }
                }
				return;
			}

            if (env.BRANCH_NAME == PROD_BRANCH) {
				echo "Deploy to prod"
                withCredentials([file(credentialsId: PROD_SERVICE_ACCOUNT_KEY, variable: 'KEY_FILE')]) {
                    docker.withRegistry("${GCR_URL}", "gcr:${GCR_CREDENTIALS}") {
                        docker.image('us.gcr.io/odin-214321/jenkins-deployer:0.1.0').inside("-u root") {
                            sh "/root/google-cloud-sdk/bin/gcloud auth activate-service-account ${PROD_SERVICE_ACCOUNT} --key-file=${KEY_FILE}"
                            sh "/root/google-cloud-sdk/bin/gcloud container clusters get-credentials ${PROD_CLUSTER_NAME} --zone ${PROD_ZONE} --project ${PROD_GCP_PROJECT}"
                            retry(3) {
                                sh "helm upgrade --values kubernetes/thor-api/values/values-prod.yaml thor-api kubernetes/thor-api --set env.DOCKER_REPOSITORY=${DOCKER_REPOSITORY} --set env.TAG=${version} --wait --timeout 600"
                            }
                        }
                    }
                }
				return;
			}
            echo "Skipping. Runs only for ${DEV_BRANCH}, ${STG_BRANCH} and ${PROD_BRANCH} branches"
		}
    }
    catch (ex) {
        currentBuild.result = "FAILED"
        errorMessage = ex.getMessage()
        throw ex
    }
    finally {
        stage('Clean up') {
            cleanWs()
        }
    }
}