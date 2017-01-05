FROM node:alpine
MAINTAINER Wikicaves

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app
WORKDIR /usr/src/app

CMD [ "node", "app.js", "--prod" ]
EXPOSE 1337
