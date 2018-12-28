#!/usr/bin/env bash
# Author: Benjamin Soufflet - Wikicaves
# Date: Dec 29 2016
# Requirement: docker
#
# This script will create and run 2 Docker containers on your local computer :
# - {MYSQL_TAGNAME} mysql container with initial data loaded (all scripts of "sql" folder executed)
# - {GC_TAGNAME} nodejs container with current grottocenter app loaded in production and connected to {MYSQL_TAGNAME}
# - {ES_TAGNAME} elasticsearch container that is used for all research on the app
# - {LS_TAGNAME} logstash container that pipe data from {MYSQL_TAGNAME} container to {ES_TAGNAME} container.
#   The config file is the logstash.conf and populates the elasticsearch container.
#
# - The database is accessible from your local machine on 127.0.0.1 and port {MYSQL_LOCAL_PORT}
# - The Grottocenter App running on the docker container is accessible on http://localhost:{GC_LOCAL_PORT}/
# - The Elasticsearch App running on the docker container is accessible on http://localhost:{ES_LOCAL_PORT}/ or through the container {ES_TAGNAME}:{ES_LOCAL_PORT}
#

###################################################### LOCAL VARIABLES #########################################################
MYSQL_TAGNAME="mysqlgrotto"
GC_TAGNAME="localgrotto"
MYSQL_LOCAL_PORT=33060
GC_LOCAL_PORT=8081
DOCKER_MYSQL_USER="sailsuser"
DOCKER_MYSQL_PASSWORD="grottocepassword"
DOCKER_MYSQL_DATABASE="grottoce"
ES_TAGNAME="elasticsearchgrotto"
ES_LOCAL_PORT=9200
LS_TAGNAME="logstashgrotto"

##################################################### FUNCTIONS #########################################################

# Get the status of the health of the container name passed in parameter.
# Health = "starting" || Health = "healthy" || Health = "unhealthy"
function getContainerHealth {
  docker inspect --format "{{json .State.Health.Status }}" $1
}

# Function that waits for a container to be healthy or unhealthy.
# It prints a "." during starting and sleep 5 seconds before checking the status of the container.
function waitContainer {
  while STATUS=$(getContainerHealth $1); [ $STATUS != "\"healthy\"" ]; do 
    if [ $STATUS == "\"unhealthy\"" ]; then
      echo "Failed!"
      exit -1
    fi
    printf .
    lf=$'\n'
    sleep 5
  done
  printf "$lf"
}

##################################################### MAIN FUNCTION #########################################################

echo "### BUILDING app locally using prod tasks ###"
NODE_ENV=production grunt prod

### RUNNING DOCKER IMAGES INSTANCES ###

# Delete the MySQL container if one was running then launch a MySQL container with data loaded.
# The health of this container is defined to healthy when we can send a ping to mysqladmin.
# The database is populated with files in the sql folder.
echo "### LAUNCHING MySQL Container ###"
docker rm -f ${MYSQL_TAGNAME}
docker run -d \
--name ${MYSQL_TAGNAME} \
--health-cmd='mysqladmin ping --silent' \
-p ${MYSQL_LOCAL_PORT}:3306 \
-v "$PWD"/sql:/docker-entrypoint-initdb.d \
-e MYSQL_RANDOM_ROOT_PASSWORD=yes \
-e MYSQL_USER=${DOCKER_MYSQL_USER} \
-e MYSQL_PASSWORD=${DOCKER_MYSQL_PASSWORD} \
-e MYSQL_DATABASE=${DOCKER_MYSQL_DATABASE} \
mysql/mysql-server:5.7

# Wait the container to be running
waitContainer ${MYSQL_TAGNAME}
echo "### MySQL is RUNNING ###"

# The database is entirely populated when we can reach a request to mysql from outside the container
echo "### POPULATING Database ###"
#TODO: Handle the message when database is populated
until curl -X GET "localhost:${MYSQL_LOCAL_PORT}" --silent
do
    # Print a "." and wait for 5 seconds before check again
    printf .
    sleep 5
done

echo "### Database POPULATED ###"

echo "### BUILD the grottocenter docker image ###"
# Unlimited swap memory during build
docker build --memory-swap -1 -t ${GC_TAGNAME} .  || { echo '######## Build failed - Exiting now #########' ; exit 1; }

#TODO: Use an ES container in production
# Delete the Elasticsearch container if already running and then create an Elasticsearch container for development with only one node.
echo "### BUILD the Elastic search container in development mode ###"
docker rm -f ${ES_TAGNAME}
docker run -d \
    --name ${ES_TAGNAME} \
    -p ${ES_LOCAL_PORT}:9200 \
    -p 9300:9300 \
    -e "discovery.type=single-node" \
    elasticsearch:6.5.0
echo "### Elasticsearch available on port ${ES_LOCAL_PORT} ###"

# Dowload and extract a plugin to be used by Logstash to load data from MySQL
echo "### Download and Build the JDBC plugin for Logstash ###"
wget http://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-5.1.47.tar.gz -O ./mysql-connector.tar.gz
tar -xvzf mysql-connector.tar.gz
echo "### JDBC plugin downloaded and built ###"

# Delete the Logstash container if already running and then create a Logstash container with the logstash.conf as configuration file.
# The health of this container is defined to healthy when we can send a ping to localhost:9600. And the unhealthy status is made after 5 wrong retries
# to access the localhost:9600
# We parameter the elasticsearch url to be the same than the tagname of our Elasticsearch container. 
# That means we can access to elasticsearch inside a container with the url "elasticsearchgrotto:9200"
echo "### BUILD the Logstash container ###"
docker rm -f ${LS_TAGNAME}
docker run --rm -d \
    --name ${LS_TAGNAME} \
    --health-cmd='curl -X GET "localhost:9600" --silent' \
    --health-retries=5 \
    --link ${MYSQL_TAGNAME} \
    --link ${ES_TAGNAME} \
    -e XPACK.MONITORING.ELASTICSEARCH.URL=${ES_TAGNAME} \
    -v "$PWD":/config-dir docker.elastic.co/logstash/logstash:6.5.2 \
    -f /config-dir/logstash.conf

# Wait the container to be running
waitContainer ${LS_TAGNAME}
echo "### Logstash available and Data IS LOADING into ${ES_TAGNAME} ### \n"

echo "### WARNING, DEPENDING ON YOUR DATA THIS STEP CAN TAKE MORE THAN 5 MINUTES !!! ###"

echo "### RUN grottocenter image locally ###"
# Here with sails_models__connection we override the production models connection to use the dev database
docker rm -f ${GC_TAGNAME}
docker run -d \
    -p ${GC_LOCAL_PORT}:8080 \
    --restart=always \
    -e sails_models__connection=grottoceMysqlLocalDocker \
    -e sails_appUrl='http://localhost:${GC_LOCAL_PORT}' \
    --name=${GC_TAGNAME} \
    --link ${MYSQL_TAGNAME} \
    --link ${ES_TAGNAME} \
    ${GC_TAGNAME}

echo "########################################"
echo "### End of the deployment process - Grottocenter available on port ${GC_LOCAL_PORT} ###"


