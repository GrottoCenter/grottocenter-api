#!/usr/bin/env bash
# Author: Benjamin Soufflet - Wikicaves
# Date: Aug 29 2017
# Requirement: gcloud (see README.md for more info)
# Warnings :
# - Make sure that your public SSH key has been added to the project on Google Cloud
# - The file config/env/production.js containing the credentials to the CLoud SQL database
#   need to be available (this file is not in the git repository for security reasons).
#
# Summary : This script deploy your current version of the Grottocenter3 Application
#           to the production server on Google App Engine.
#
# Steps of this script :
# - Check that the file config/env/production.js is available
# - build the app locally with grunt using the "production" settings
# - Connect to the google cloud project
# - Deploy the app to App Engine
#


# Set Variables ###########################
PROJECT_ID="grottocenter-beta"

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

echo "### Set GCloud Project to ${PROJECT_ID} ###"
gcloud config set project ${PROJECT_ID}

echo "### DEPLOY app with Google App Engine ###"
gcloud app deploy app.yaml

echo "### End of the deployment process ###"
