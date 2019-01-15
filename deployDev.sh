#!/usr/bin/env bash
# Author: Benjamin Soufflet - Wikicaves
# Date: Dec 29 2016
# Requirement: docker
#
# This script will create and run 2 Docker containers on your local computer :
# - {MYSQL_TAGNAME} mysql container with initial data loaded (all scripts of "sql" folder executed)
# - {ES_TAGNAME} elasticsearch container that is used for all research on the app
# - {LS_TAGNAME} logstash container that pipe data from {MYSQL_TAGNAME} container to {ES_TAGNAME} container.
#   The config file is the logstash.conf and populates the elasticsearch container.
#
# - The database is accessible from your local machine on 127.0.0.1 and port {MYSQL_LOCAL_PORT}
# - The Grottocenter App running on the docker container is accessible on http://localhost:{GC_LOCAL_PORT}/
# - The Elasticsearch App running on the docker container is accessible on http://localhost:{ES_LOCAL_PORT}/ or through the container {ES_TAGNAME}:{ES_LOCAL_PORT}
#

###################################################### LOCAL VARIABLES #########################################################
# MySQL Database
MYSQL_TAGNAME="mysqlgrotto"
MYSQL_LOCAL_PORT=33060
DOCKER_MYSQL_USER="root"
DOCKER_MYSQL_PASSWORD="root"
DOCKER_MYSQL_DATABASE="grottoce"

# Elasticsearch
ES_TAGNAME="elasticsearchgrotto"
ES_LOCAL_PORT=9200

# Logstash
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
isSQLContainerExisting="$(docker ps --all --quiet --filter=name="$MYSQL_TAGNAME")"
if [ -n "$isSQLContainerExisting" ]; then
  echo "### DELETING old MySQL Container ###"
  docker stop $MYSQL_TAGNAME && docker rm -f $MYSQL_TAGNAME
fi

echo "### LAUNCHING MySQL Container ###"
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
until curl -X GET "localhost:${MYSQL_LOCAL_PORT}" --silent > /dev/null
do
    # Print a "." and wait for 5 seconds before check again
    printf .
    sleep 5
done
echo ""
echo "### Database POPULATED ###"

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
    elasticsearch:6.5.0
echo "### Elasticsearch available on port ${ES_LOCAL_PORT} ###"

# Dowload and extract a plugin to be used by Logstash to load data from MySQL
echo "### Download and Build the JDBC plugin for Logstash ###"
wget https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-5.1.47.tar.gz -O ./mysql-connector.tar.gz
tar -xzf mysql-connector.tar.gz
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
    --link ${MYSQL_TAGNAME} \
    --link ${ES_TAGNAME} \
    -e XPACK.MONITORING.ELASTICSEARCH.URL=${ES_TAGNAME} \
    -v "$PWD":/config-dir docker.elastic.co/logstash/logstash:6.5.2 \
    -f /config-dir/logstash.dev.conf

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