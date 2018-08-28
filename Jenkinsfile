#!groovy

properties(
        [[$class  : 'BuildDiscarderProperty',
          strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '15', artifactNumToKeepStr: '15', daysToKeepStr: '15', numToKeepStr: '15']]])

def SERVICE_NAME = "thor-api"
def NAMESPACE = "thor-api"
def DOCKER_REPOSITORY = "us.gcr.io/odin-214321/thor-api"
def GCR_CREDENTIALS = "odin-214321"
def PROD_BRANCH = "prod"
def GCR_URL = "https://us.gcr.io"
// TODO: Uncommnet and update for prod deployment
// def PROD_SERVICE_ACCOUNT = ""
// def PROD_SERVICE_ACCOUNT_KEY = ""
// def PROD_GCP_PROJECT = ""
// def PROD_CLUSTER_NAME = ""
// def PROD_ZONE = ""
def DEV_BRANCH = "master"
def DEV_SERVICE_ACCOUNT = "jenkins-thor-deployer@odin-214321.iam.gserviceaccount.com"
def DEV_SERVICE_ACCOUNT_KEY = "thor-dev-service-account-key"
def DEV_GCP_PROJECT = "odin-214321"
def DEV_CLUSTER_NAME = "thor-dev"
def DEV_ZONE = "us-west1-a"

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
                    sh 'npm install'
                }
            }
        }

        stage('Test') {
            dir("./") {
                docker.image("node:carbon").inside('') {
                    sh 'npm run test'
                }
            }
        }

        stage('Build modules') {
            dir("./") {
                docker.image("node:carbon").inside('') {
                    sh 'npm run build'
                    sh 'npm run swagger'
                }
            }
        }

        stage('Build image') {
            if (env.BRANCH_NAME != DEV_BRANCH && env.BRANCH_NAME != PROD_BRANCH) {
                echo "Skipping. Runs only for ${DEV_BRANCH} and ${PROD_BRANCH} branches"
                return;
            }
            sh "docker build -t ${DOCKER_REPOSITORY}:${version} ."
        }

        stage('Push image') {
            if (env.BRANCH_NAME != DEV_BRANCH && env.BRANCH_NAME != PROD_BRANCH) {
                echo "Skipping. Runs only for ${DEV_BRANCH} and ${PROD_BRANCH} branches"
                return;
            }
            docker.withRegistry("${GCR_URL}", "gcr:${GCR_CREDENTIALS}") { 
                sh "docker push ${DOCKER_REPOSITORY}:${version}"
            } 
        }

        // TODO: Update deployment process to use helm. Using kubectl directly is a deprecated approach.
        stage('Deploy') {
			if (env.BRANCH_NAME == DEV_BRANCH) {
				echo "Deploy to dev"
                withCredentials([file(credentialsId: DEV_SERVICE_ACCOUNT_KEY, variable: 'KEY_FILE')]) {
                    sh 'mkdir -p gcloud'
                    sh 'mkdir -p kube'
                    docker.image('google/cloud-sdk').inside("-v ${WORKSPACE}/gcloud:/.config/gcloud -v ${WORKSPACE}/kube:/.kube") {
                        sh "gcloud auth activate-service-account ${DEV_SERVICE_ACCOUNT} --key-file=${KEY_FILE}"
                        sh "gcloud container clusters get-credentials ${DEV_CLUSTER_NAME} --zone ${DEV_ZONE} --project ${DEV_GCP_PROJECT}"
                        sh "kubectl --namespace=${NAMESPACE} set image deployment/${SERVICE_NAME} ${SERVICE_NAME}=${DOCKER_REPOSITORY}:${version} --record"
                        try {
                            timeout(time: 300, unit: 'SECONDS') {
                                sh "kubectl --namespace=${NAMESPACE} rollout status deployment/${SERVICE_NAME}"
                            }
                        }
                        catch (ex) {
                            sh "kubectl --namespace=${NAMESPACE} rollout undo deployment/${SERVICE_NAME}"
                            throw ex
                        }
                    }
                }
				return;
			}

            if (env.BRANCH_NAME == PROD_BRANCH) {
				echo "Deploy to prod"
                withCredentials([file(credentialsId: PROD_SERVICE_ACCOUNT_KEY, variable: 'KEY_FILE')]) {
                    sh 'mkdir -p gcloud'
                    sh 'mkdir -p kube'
                    docker.image('google/cloud-sdk').inside("-v ${WORKSPACE}/gcloud:/.config/gcloud -v ${WORKSPACE}/kube:/.kube") {
                        sh "gcloud auth activate-service-account ${PROD_SERVICE_ACCOUNT} --key-file=${KEY_FILE}"
                        sh "gcloud container clusters get-credentials ${PROD_CLUSTER_NAME} --zone ${PROD_ZONE} --project ${PROD_GCP_PROJECT}"
                        sh "kubectl --namespace=${NAMESPACE} set image deployment/${SERVICE_NAME} ${SERVICE_NAME}=${DOCKER_REPOSITORY}:${version} --record"
                        try {
                            timeout(time: 300, unit: 'SECONDS') {
                                sh "kubectl --namespace=${NAMESPACE} rollout status deployment/${SERVICE_NAME}"
                            }
                        }
                        catch (ex) {
                            sh "kubectl --namespace=${NAMESPACE} rollout undo deployment/${SERVICE_NAME}"
                            throw ex
                        }
                    }
                }
				return;
			}
            echo "Skipping. Runs only for ${DEV_BRANCH} and ${PROD_BRANCH} branches"
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