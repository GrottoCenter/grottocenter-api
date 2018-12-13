#!/usr/bin/env bash
# Author: Benjamin Soufflet - Wikicaves
# Date: Dec 29 2016
# Requirement: docker
#
# This script will create and run 2 Docker containers on your local computer :
# - {MYSQL_TAGNAME} mysql container with initial data loaded (all scripts of "sql" folder executed)
# - {GC_TAGNAME} nodejs container with current grottocenter app loaded in production and connected to {MYSQL_TAGNAME}
#
# - The database is accessible from your local machine on 127.0.0.1 and port {MYSQL_LOCAL_PORT}
# - The Grottocenter App running on the docker container is accessible on http://localhost:{GC_LOCAL_PORT}/
#

MYSQL_TAGNAME="mysqlgrotto"
GC_TAGNAME="localgrotto"
MYSQL_LOCAL_PORT=33060
GC_LOCAL_PORT=8081
DOCKER_MYSQL_USER="sailsuser"
DOCKER_MYSQL_PASSWORD="grottocepassword"
DOCKER_MYSQL_DATABASE="grottoce"
ES_TAGNAME="elasticsearchgrotto"
LS_TAGNAME="logstashgrotto"

echo "### Building app locally using prod tasks ###"
NODE_ENV=production grunt prod

### RUNNING DOCKER IMAGES INSTANCES ###

echo "### Running MySQL local container with default data loaded"
docker rm -f ${MYSQL_TAGNAME}
docker run -d \
--name ${MYSQL_TAGNAME} \
-p ${MYSQL_LOCAL_PORT}:3306 \
-v "$PWD"/sql:/docker-entrypoint-initdb.d \
-e MYSQL_RANDOM_ROOT_PASSWORD=yes \
-e MYSQL_USER=${DOCKER_MYSQL_USER} \
-e MYSQL_PASSWORD=${DOCKER_MYSQL_PASSWORD} \
-e MYSQL_DATABASE=${DOCKER_MYSQL_DATABASE} \
-d mysql/mysql-server:5.7

echo "### BUILD the grottocenter docker image ###"
# Unlimited swap memory during build
docker build --memory-swap -1 -t ${GC_TAGNAME} .  || { echo '######## Build failed - Exiting now #########' ; exit 1; }

echo "### BUILD the Elastic search container in development mode ###"
docker rm -f ${ES_TAGNAME}
docker run -d --name ${ES_TAGNAME} -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:6.5.0
echo "### Elasticsearch available on port 9200 ###"

echo "### Download and Build the JDBC plugin ###"
wget http://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-5.1.47.tar.gz -O ./mysql-connector.tar.gz
tar -xvzf mysql-connector.tar.gz
echo "### JDBC plugin downloaded and built ###"

echo "### BUILD the Logstash container ###"
docker rm -f ${LS_TAGNAME}
docker run --rm -it --name ${LS_TAGNAME} --link ${MYSQL_TAGNAME} --link ${ES_TAGNAME} -e XPACK.MONITORING.ELASTICSEARCH.URL=${ES_TAGNAME} -v "$PWD":/config-dir docker.elastic.co/logstash/logstash:6.5.2 -f /config-dir/logstash.conf
echo "### Logstash available ###"

echo "### RUN grottocenter Image locally ###"
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
echo "### End of the deployment process - Grottocenter available on port 8081 ###"
