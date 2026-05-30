FROM apache/superset:6.1.0

USER root
RUN uv pip install psycopg2-binary flask-cors

# Copy startup script
COPY startup.sh /usr/bin/startup.sh
RUN chmod +x /usr/bin/startup.sh

# Copy Superset configuration
COPY superset_config.py /app/pythonpath/superset_config.py

# Copy Grottocenter branding assets
COPY branding/ /app/superset/static/assets/images/grottocenter/
# Override the default favicon
COPY branding/favicon.png /app/superset/static/assets/images/favicon.png

USER superset

CMD ["/usr/bin/startup.sh"]
