FROM node:10.24.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# add the app
COPY . ./

RUN npm install -g nodemon
# install app dependencies
RUN npm install

CMD ["tail", "-f", "/dev/null"]
