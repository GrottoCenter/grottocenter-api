FROM node:16.16.0-alpine3.15

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# add the manifest
COPY package*.json ./

# install the dependencies
RUN npm install -g nodemon && npm install

# add the app
COPY . ./

CMD ["tail", "-f", "/dev/null"]
