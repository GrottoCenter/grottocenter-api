# Grottocenter

a [Sails](http://sailsjs.org) application

## Run the app :

cd to the root of the project

sails lift

[http://localhost:1337/login?email=my@email.com&password=MyPassWord] : Login to the application
[http://localhost:1337/entry] : List all entries

## Installation :

Install nodeJS

sudo npm -g install sails

npm install sails-mysql passport passport-local --save

sails new grottocenter3

cd grottocenter3

sails generate api entry

sails generate api caver

...

???

npm install passport passport-local bcryptjs validator --save

npm install --save react react-dom	

## JSON Web Token authentication

npm install jsonwebtoken --save 

## Upgrade

sudo npm update -g sails

npm update sails-mysql

## TODO :
Use sails-generate-auth (abandoned??) or sails-auth to manage the login process with passport.

## Testing purpose

npm install mocha supertest barrels sails-memory should

To run tests :
npm test 

## Deployment
SSH to the server
sudo su root
cd /var/www/Grottocenter3
### Start
forever start app.js
### Stop
forever stop app.js
