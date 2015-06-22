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

## Upgrade :

sudo npm update -g sails

npm update sails-mysql

## TODO :
Use sails-generate-auth (abandoned??) or sails-auth to manage the login process with passport.
