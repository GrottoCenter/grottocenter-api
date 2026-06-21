FROM apache/superset:6.1.0

USER root
RUN uv pip install psycopg2-binary==2.9.12 flask-cors==6.0.2 pyjwt==2.9.0

# Copy startup script
COPY startup.sh /usr/bin/startup.sh
RUN chmod +x /usr/bin/startup.sh

# Copy Superset configuration
COPY superset_config.py /app/pythonpath/superset_config.py

# Copy SSO security manager and JTI store
COPY gc_security_manager.py /app/pythonpath/gc_security_manager.py
COPY jti_store.py /app/pythonpath/jti_store.py
COPY gc_creator_permissions.py /app/pythonpath/gc_creator_permissions.py
COPY templates/ /app/pythonpath/templates/

# Copy Grottocenter branding assets
COPY branding/ /app/superset/static/assets/images/grottocenter/
# Override the default favicon
COPY branding/favicon.png /app/superset/static/assets/images/favicon.png

USER superset

CMD ["/usr/bin/startup.sh"]
