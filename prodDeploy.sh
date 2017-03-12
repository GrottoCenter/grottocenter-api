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
DOCKBUILDER="grotto-docker-builder"
DOCKER="grottocenter-vm"
STATIC_IP="grottocenter-website"
VERSION="latest"
MACHINETYPE="f1-micro"
#MACHINETYPE="g1-small"
BUILDERMACHINETYPE="n1-highcpu-2"
# This google machine Image prevent the certificate bug that we have with the default Google machine image :
# See http://stackoverflow.com/questions/40092793/error-validating-certificates-when-using-docker-machine-in-gce
MACHINEIMAGE="ubuntu-os-cloud/global/images/family/ubuntu-1610"
IMAGE=eu.gcr.io/${PROJECT_ID}/${APPNAME}:${VERSION}
###########################################

# Define functions ########################
stopDockerBuilder() {
  echo "### Stop docker builder machine ###"
  docker-machine stop ${DOCKBUILDER} || {
    echo '############# ERROR - WARNING !!!!! ##############'
    echo '############# IMPORTANT : Docker builder machine failed to stop. Please stop it manually or we will be charged a lot. #########'
    exit 1;
  }
}

createConnectDockerBuilderMachine() {
  # Create Builder machine if necessary to build the docker image
  # Indeed the micro instance has not enough RAM to build the image...
  # This builder is started during the build time and then stopped so we just pay
  # for it during a few minutes. Then we just pay for the disk storage.
  if [ -z "$(gcloud compute instances list | grep ${DOCKBUILDER})" ]
  then
      echo "### CREATE ${DOCKBUILDER} docker machine on Google ###"
      docker-machine create --driver google \
          --google-project ${PROJECT_ID} \
          --google-zone ${ZONE} \
          --google-machine-type ${BUILDERMACHINETYPE} \
          --google-machine-image ${MACHINEIMAGE} \
          ${DOCKBUILDER}
  else
      if [ -z "$(docker-machine ls | grep ${DOCKBUILDER})" ]
      then
          echo "### CONNECT VM to ${DOCKBUILDER} docker-machine ###"
          docker-machine create --driver google \
              --google-project ${PROJECT_ID} \
              --google-zone ${ZONE} \
              --google-machine-type ${BUILDERMACHINETYPE} \
              --google-use-existing \
              --google-machine-image ${MACHINEIMAGE} \
              ${DOCKBUILDER}
      fi
  fi
}
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

echo "### Building app locally using prod tasks ###"
NODE_ENV=production grunt prod || {
  echo '######## ERROR - exiting... #########'
  exit 1;
}

# Get last Google Container Image from server
# gcloud compute images list --project google-containers --no-standard-images
# Choose a version from the list
#DOCKER_OS_IMAGE="gci-stable-51-8172-47-0"

echo "### Set GCloud Project to ${PROJECT_ID} ###"
gcloud config set project ${PROJECT_ID}

createConnectDockerBuilderMachine

# Start docker builder machine if not started
if [ "Running" != "$(docker-machine status ${DOCKBUILDER})" ]
then
    echo "### Starting ${DOCKBUILDER} ###"
    docker-machine start ${DOCKBUILDER}
    sleep 10
fi

# The builder do not have a static IP so certificat need to be generated each time.
echo "### Regenerating certificats of docker builder machine ###"
docker-machine regenerate-certs -f ${DOCKBUILDER} || {
  echo '######## ERROR - Try to recreate Docker Builder Machine #########'
  docker-machine rm -f ${DOCKBUILDER}
  createConnectDockerBuilderMachine
}

echo "### Switch context to docker-machine ${DOCKBUILDER} ###"
eval "$(docker-machine env ${DOCKBUILDER})" || {
  echo '######## ERROR - exiting... #########'
  stopDockerBuilder
  exit 1;
}

echo "### BUILD the docker image ###"
# Unlimited swap memory during build
docker build --memory-swap -1 -t ${APPNAME} . || {
  echo '######## Build failed - Exiting now #########'
  stopDockerBuilder
  exit 1;
}

echo "### TAG the new Docker image into repository ###"
docker tag ${APPNAME} ${IMAGE}
echo "## image is : ${IMAGE} ##"

echo "### PUSH the new Docker image into repository ###"
gcloud docker -- push ${IMAGE}

stopDockerBuilder

echo "### DEPLOY app with Google Compute Engine on ${DOCKER} docker-machine ###"
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
eval "$(docker-machine env ${DOCKER})" || {
  echo '######## ERROR - exiting... #########'
  exit 1;
}

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
