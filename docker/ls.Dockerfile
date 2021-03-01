ARG ES_AND_LS_VERSION
FROM docker.elastic.co/logstash/logstash:${ES_AND_LS_VERSION}

# install dependency
RUN /usr/share/logstash/bin/logstash-plugin install logstash-filter-aggregate
RUN /usr/share/logstash/bin/logstash-plugin install logstash-filter-mutate

# copy lib database jdbc jars
COPY ./postgresql-42.2.14.jar /config-dir/postgresql-connector.jar
