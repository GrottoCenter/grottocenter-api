ARG ES_AND_LS_VERSION
FROM docker.elastic.co/logstash/logstash:${ES_AND_LS_VERSION}

# install dependency
RUN /usr/share/logstash/bin/logstash-plugin install logstash-integration-jdbc
RUN /usr/share/logstash/bin/logstash-plugin install logstash-filter-aggregate
RUN /usr/share/logstash/bin/logstash-plugin install logstash-filter-mutate
