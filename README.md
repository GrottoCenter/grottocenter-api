# Grottocenter 3

The Wiki database made by cavers for cavers
A [Sails](http://sailsjs.org) application

## Installation :

### Install NodeJS

Min version XYZ

### Get source code

GitHub repository
https://github.com/GrottoCenter/Grottocenter3.git

### Install packages

    sudo npm install

### Run the app

    cd to the root of the project
    sails lift

Go to [http://localhost:1337/] : homepage

### ATOM modules

Editor used for developments

and following modules :

    apm install react
    apm install atom-react-autocomplete
    apm install atom-beautify
    apm install keyboard-localization
    apm install editorconfig

For atom-beautify, on settings, activate "Beautify on save" for JS, JSX, HTML and CSS

## Usefull commands

### Create Sails app from scratch

Install nodeJS

    sudo npm -g install sails
    sails new <myApp>

### Add a module on package file

    cd /PATH/TO/<myApp>
    npm install sails-mysql --save

### Generate model and controller

    sails generate api entry

### Upgrade a component

SailsJS:

    sudo npm update -g sails

Any sails module:

    npm update sails-mysql

### Run tests

    npm test

### GIT usage

#### Commit

Commits must be done on specific branch.
On GitHub, on "Pull request" tab (https://github.com/GrottoCenter/Grottocenter3/pulls), create a pull request (New pull request)
Let base: master and compare: the branch
Create the pull request

After contribution (that can include follow-up commits), branch can be merged on master with button "Merge pull request"
In most ways, change the "Merge pull request" to "Rebase and merge" using the arrow on the right of the green button

### Deployment

SSH to the server

    sudo su root
    cd /var/www/Grottocenter3

#### Start
    forever start app.js

#### Stop
    forever stop app.js

## Technologic choices

### Database

MySQL v5.0

    npm install sails-mysql --save

We use the built-in Waterline ORM

### Front layer

Babel

    npm install grunt-babel babel-preset-es2015 babel-preset-react --save

Bootstrap v3

HTML5 + CSS3

### JSON Web Token authentication

For API access control, JWT is used

    npm install jsonwebtoken --save

### User authentication

    npm install passport passport-local bcryptjs validator --save

Use sails-generate-auth (abandoned??) or sails-auth to manage the login process with passport.

### Testing

Mocha + Barrels

    npm install mocha supertest barrels sails-memory should
