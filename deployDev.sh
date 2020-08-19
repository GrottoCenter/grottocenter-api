#!/usr/bin/env bash
# Author: Benjamin Soufflet - Wikicaves
# Date: Dec 29 2016
# Requirement: docker
#
# This script will create and run 2 Docker containers on your local computer :
# - {DB_TAGNAME} mysql container with initial data loaded (all scripts of "sql" folder executed)
# - {ES_TAGNAME} elasticsearch container that is used for all research on the app
# - {LS_TAGNAME} logstash container that pipe data from {DB_TAGNAME} container to {ES_TAGNAME} container.
#   The config file is the logstash.conf and populates the elasticsearch container.
#
# - The database is accessible from your local machine on 127.0.0.1 and port {DB_LOCAL_PORT}
# - The Grottocenter App running on the docker container is accessible on http://localhost:{GC_LOCAL_PORT}/
# - The Elasticsearch App running on the docker container is accessible on http://localhost:{ES_LOCAL_PORT}/ or through the container {ES_TAGNAME}:{ES_LOCAL_PORT}
#

###################################################### LOCAL VARIABLES #########################################################
# PostgreSQL Database
DB_TAGNAME="postgresgrotto"
DB_LOCAL_PORT=33060
DOCKER_DB_USER="root"
DOCKER_DB_PASSWORD="root"
DOCKER_DB_DATABASE="grottoce"

# Elasticsearch
ES_TAGNAME="elasticsearchgrotto"
ES_LOCAL_PORT=9200

# Logstash
LS_TAGNAME="logstashgrotto"

# Keep the same version as the production one (on AWS)
ES_AND_LS_VERSION="7.6.1"

##################################################### FUNCTIONS #########################################################

# Get the status of the health of the container name passed in parameter.
# Health = "starting" || Health = "healthy" || Health = "unhealthy"
function getContainerHealth {
  docker inspect --format "{{json .State.Health.Status }}" $1
}

# Wait for a container to be healthy or unhealthy.
# It prints a "." during starting and sleep 5 seconds before checking the status of the container.
function waitContainer {
  while STATUS=$(getContainerHealth $1); [[ $STATUS != "\"healthy\"" ]]; do
    if [[ $STATUS == "\"unhealthy\"" ]]; then
      echo "Failed!"
      exit -1
    fi
    printf .
    sleep 5
  done
  lf=$'\n'
  printf "$lf"
}

##################################################### MAIN FUNCTION #########################################################

### RUNNING DOCKER IMAGES INSTANCES ###

# Delete the MySQL container if one was running then launch a MySQL container with data loaded.
# The health of this container is defined to healthy when we can send a ping to mysqladmin.
# The database is populated with files in the sql folder.
# For Windows replace the `PWD` with the full path
isSQLContainerExisting="$(docker ps --all --quiet --filter=name="$DB_TAGNAME")"
if [ -n "$isSQLContainerExisting" ]; then
  echo "### DELETING old PostgreSQL Container ###"
  docker stop $DB_TAGNAME && docker rm -f $DB_TAGNAME
fi

echo "### LAUNCHING PostgreSQL Container ###"
docker run -d \
--name ${DB_TAGNAME} \
--health-cmd='pg_isready' \
-p ${DB_LOCAL_PORT}:5432 \
-v "$PWD"/sql:/docker-entrypoint-initdb.d \
-e POSTGRES_USER=${DOCKER_DB_USER} \
-e POSTGRES_PASSWORD=${DOCKER_DB_PASSWORD} \
postgres

# Wait the container to be running
waitContainer ${DB_TAGNAME}
echo "### MySQL is RUNNING ###"

# The database is entirely populated when we can reach a request to mysql from outside the container
# echo "### POPULATING Database ###"
# #TODO: Handle the message when database is populated
# until curl -X GET "localhost:${DB_LOCAL_PORT}" --silent > /dev/null
# do
#     # Print a "." and wait for 5 seconds before check again
#     printf .
#     sleep 5
# done
# echo ""
# echo "### Database POPULATED ###"

# Delete the Elasticsearch container if already running and then create an Elasticsearch container for development with only one node.
isESContainerExisting="$(docker ps --all --quiet --filter=name="$ES_TAGNAME")"
if [ -n "$isESContainerExisting" ]; then
  echo "### DELETING old Elasticsearch Container ###"
  docker stop $ES_TAGNAME && docker rm -f $ES_TAGNAME
fi

echo "### BUILD the Elasticsearch container in development mode ###"
docker run -d \
    --name ${ES_TAGNAME} \
    -p ${ES_LOCAL_PORT}:9200 \
    -p 9300:9300 \
    -e "discovery.type=single-node" \
    --cpus=0.5 \
    elasticsearch:${ES_AND_LS_VERSION}
echo "### Elasticsearch available on port ${ES_LOCAL_PORT} ###"

echo "### Download and Build the JDBC plugin for Logstash ###"
wget https://jdbc.postgresql.org/download/postgresql-42.2.14.jar -O ./postgresql-connector.jar
echo "### JDBC plugin downloaded and built ###"

# Delete the Logstash container if already running and then create a Logstash container with the logstash.conf as configuration file.
# The health of this container is defined to healthy when we can send a ping to localhost:9600. And the unhealthy status is made after 5 wrong retries
# to access the localhost:9600
# We set the elasticsearch url to be the same than the tagname of our Elasticsearch container.
# That means we can access to elasticsearch inside a container with the url "elasticsearchgrotto:9200".
isLSContainerExisting="$(docker ps --all --quiet --filter=name="$LS_TAGNAME")"
if [ -n "$isLSContainerExisting" ]; then
  echo "### DELETING old Logstash Container ###"
  docker stop $LS_TAGNAME && docker rm -f $LS_TAGNAME
fi

echo "### BUILD the Logstash container ###"
docker run --rm -d \
    --name ${LS_TAGNAME} \
    --health-cmd='curl -X GET "localhost:9600" --silent' \
    --health-retries=5 \
    --link ${DB_TAGNAME} \
    --link "${ES_TAGNAME}:elasticsearch" \
    -e XPACK.MONITORING.ELASTICSEARCH.URL=${ES_TAGNAME} \
    -e CONFIG.SUPPORT_ESCAPES=true \
    -e JDBC_POSTGRESQL="jdbc:postgresql://${DB_TAGNAME}/${DOCKER_DB_DATABASE}" \
    -e JDBC_USER=${DOCKER_DB_USER} \
    -e JDBC_PASSWORD=${DOCKER_DB_PASSWORD} \
    -e ES_HOSTS="${ES_TAGNAME}:${ES_LOCAL_PORT}" \
    -v "$PWD":/config-dir docker.elastic.co/logstash/logstash:${ES_AND_LS_VERSION} \
    -f /config-dir/logstash.conf

# Wait the container to be running
waitContainer ${LS_TAGNAME}
echo "### Logstash available and Data IS LOADING into ${ES_TAGNAME} ###"

echo "### WARNING, depending on your data this step can take 5-10 minutes or even more! ###"
echo "### Note that even if the deployment process is finished, the indexation will continue in the background. ###"
echo "### You can go to http://localhost:9200/_cat/indices?v to see the number of documents indexed."
echo ""
echo "####################################################"
echo "#### Grottocenter development environment ready ####"
echo "####################################################"
echo ""
echo "Run 'npm run start-hot' command to launch the server in live reloading mode! Happy coding :)"
