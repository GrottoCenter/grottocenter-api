FROM postgis/postgis:16-3.4

# Install pg_cron
# This may upgrade PostgreSQL to a newer minor version!
RUN apt-get update && \
    apt-get install -y --no-install-recommends --no-upgrade postgresql-16-cron && \
    rm -rf /var/lib/apt/lists/*

RUN echo "shared_preload_libraries = 'pg_cron'" >> /usr/share/postgresql/postgresql.conf.sample
