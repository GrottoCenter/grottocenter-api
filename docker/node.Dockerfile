FROM node:18.6.0-alpine

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
