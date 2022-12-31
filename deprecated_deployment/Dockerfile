# This Dockerfile is used to deploy the app on App Engine
#
# Dockerfile extending the generic Node image with application files for a
# single application.
FROM gcr.io/google_appengine/nodejs
COPY package.json /app/
# You have to specify "--unsafe-perm" with npm install
# when running as root.  Failing to do this can cause
# install to appear to succeed even if a preinstall
# script fails, and may have other adverse consequences
# as well.
# This command will also cat the npm-debug.log file after the
# build, if it exists.
RUN npm install --production --unsafe-perm || \
  ((if [ -f npm-debug.log ]; then \
      cat npm-debug.log; \
    fi) && false)
COPY . /app
# This environment variable disable the grunt build on production
# So the app need to be build using "grunt prod" before creating the docker image
ENV sails_hooks__grunt=false
ENV NODE_ENV=production
CMD [ "node", "app.js" ]
EXPOSE 8080
