#!/usr/bin/env bash
# Author: Benjamin Soufflet - Wikicaves
# Date: Dec 29 2016
# Requirement: docker-machine, gcloud
# Warnings :
# - Make sure that your public SSH key has been added to the project on Google Cloud
# - The file config/env/production.js containing the credentials to the CLoud SQL database
#   need to be available (this file is not in the git repository for security reasons).
#
# Summary : This script deploy your current version of the Grottocenter3 Application
#           to the production server on Google Cloud.
#
# Steps of this script :
# - Check that the file config/env/production.js is available
# - Connect to the google cloud project and create the compute engine (docker-machine) if
# it doesn't exists yet.
# - Connect to the created remote docker-machine and build the docker image on it then push
# the docker image to the google repository
# - Delete the running grottocenter docker container on the remote docker-machine
# and run a new one from the pushed image created just before.


# Set Variables ###########################
PROJECT_ID="grottocenter-cloud"
APPNAME="grottocenter"
ZONE="europe-west1-b"
REGION="europe-west1"
VMNAME="grottocenter-vm"
#DOCKBUILDER="grotto-docker-builder"
DOCKER="grottocenter-vm"
STATIC_IP="grottocenter-website"
VERSION="latest"
#MACHINETYPE="f1-micro"
MACHINETYPE="g1-small"

# This google machine Image prevent the certificate bug that we have with the default Google machine image :
# See http://stackoverflow.com/questions/40092793/error-validating-certificates-when-using-docker-machine-in-gce
MACHINEIMAGE="https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/ubuntu-1604-xenial-v20161205"
IMAGE=eu.gcr.io/${PROJECT_ID}/${APPNAME}:${VERSION}
###########################################

# Check that production.js is available before the deploy !
productionConfigFile="config/env/production.js"
if [ -f "$productionConfigFile" ]
then
	echo "$productionConfigFile found ! Production deployment will continue."
else
	echo "$productionConfigFile not found ! Production deployment impossible. Exiting now..."
  exit 1
fi

# Get last Google Container Image from server
# gcloud compute images list --project google-containers --no-standard-images
# Choose a version from the list
#DOCKER_OS_IMAGE="gci-stable-51-8172-47-0"

echo "### Set GCloud Project ###"
gcloud config set project ${PROJECT_ID}

# Create the Static IP
# gcloud compute addresses create ${STATIC_IP} --project ${PROJECT_ID} --region ${REGION}

# Create docker machine on project for Grottocenter Sails App
if [ -z "$(gcloud compute instances list | grep ${DOCKER})" ]
then
    echo "### CREATE ${DOCKER} docker machine on Google ###"
    docker-machine create --driver google \
    --google-project ${PROJECT_ID} \
    --google-zone ${ZONE} \
    --google-tags "http-server" \
    --google-address ${STATIC_IP} \
    --google-machine-type ${MACHINETYPE} \
    --google-machine-image ${MACHINEIMAGE} \
    ${DOCKER}
else
    if [ -z "$(docker-machine ls | grep ${DOCKER})" ]
    then
        echo "### CONNECT VM to ${DOCKER} docker-machine ###"
        docker-machine create --driver google \
        --google-project ${PROJECT_ID} \
        --google-tags "http-server" \
        --google-zone ${ZONE} \
        --google-use-existing \
        --google-address ${STATIC_IP} \
        --google-machine-type ${MACHINETYPE} \
        --google-machine-image ${MACHINEIMAGE} \
        ${DOCKER}
    fi
fi

# Start docker machine if not started
if [ "Running" != "$(docker-machine status ${DOCKER})" ]
then
    echo "### Starting ${DOCKER} ###"
    docker-machine start ${DOCKER}
    sleep 20
fi

# change docker machine context to be the Google Machine
echo "### Switch context to docker-machine ${DOCKER} ###"
eval "$(docker-machine env ${DOCKER})"


echo "### BUILD the docker image ###"
# Unlimited swap memory during build
docker build --memory-swap -1 -t ${APPNAME} .  || { echo '######## Build failed - Exiting now #########' ; exit 1; }

echo "### TAG the new Docker image into repository ###"
docker tag ${APPNAME} ${IMAGE}
echo "## image is : ${IMAGE} ##"

echo "### PUSH the new Docker image into repository ###"
gcloud docker -- push ${IMAGE}

echo "### remove all empty containers ###"
docker ps -a | grep Exit | cut -d ' ' -f 1 | xargs docker rm

echo "### RUN Image on docker-machine ###"
docker rm -f ${APPNAME}
docker run -d \
    -p 80:1337 \
    --restart=always \
    --name=${APPNAME} \
    ${IMAGE}

echo "### End of the deployment process ###"
