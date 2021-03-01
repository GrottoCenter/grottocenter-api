FROM node:10.23.3-stretch
# current-alpine3.12

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# add the app
COPY . ./

# install app dependencies
RUN npm install

CMD ["tail", "-f", "/dev/null"]
