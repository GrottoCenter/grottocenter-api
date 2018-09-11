# Grottocenter 3

[![Travis Status](https://travis-ci.org/GrottoCenter/Grottocenter3.svg?branch=rc)](https://travis-ci.org/GrottoCenter/Grottocenter3.svg?branch=rc)
[![Coverage Status](https://coveralls.io/repos/github/GrottoCenter/Grottocenter3/badge.svg?branch=rc)](https://coveralls.io/github/GrottoCenter/Grottocenter3?branch=rc)

The Wiki database made by cavers for cavers

![GC flyer](https://rawgit.com/wiki/GrottoCenter/Grottocenter3/images/afficheGC3.svg)

## Installation (On UBUNTU):

### Install NPM (package manager)
Min version: 4.1.2

sudo apt-get update

sudo apt-get install nodejs npm

sudo apt install nodejs-legacy

### Install Docker (contener manager)
sudo apt://docker.io

### Get source code
cd \<root of the project\>
git clone https://github.com/GrottoCenter/Grottocenter3.git

### Install packages
cd \<Grottocenter3\>
  
sudo npm install

### Run the app locally
./localDeploy.sh

Go to [http://localhost:1337/] : homepage

## Following use after installation (On UBUNTU):

### Update source code
cd \<root of the project\>
  
git pull

### Update packages
cd \<Grottocenter3\>
  
sudo npm update

### Run the app locally
./localDeploy.sh

Go to [http://localhost:1337/] : homepage

## Developer instructions
### GIT configuration
```
git config --global user.name "my-github-username"
git config --global user.email "my@email.com"
git config --global help.autocorrect -1
git config --global color.ui auto
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
git config --global diff.mnemonicprefix true
git config --global rerere.enabled true
git config --global push.default upstream
git config --global rebase.autosquash true
git config --global rebase.autostash true
git config --global core.autocrlf false
git config --local core.autocrlf false
git config --global pull.rebase true
```
### GIT usage

- All features commit must be done on a specific local branch. (Only urgent bug fix should be done directly on `master`)
- `git rebase -i` need to be used to group multiple "work in progress" commits into a single commit.
- When the feature is ready you need to create a `pull request` on Github (https://github.com/GrottoCenter/Grottocenter3/pulls)  : Let base: master and compare: the branch
- After the code review (which can include follow-up commits), the branch can be merged on master with button "Merge pull request"
In most cases, change the "Merge pull request" to "Rebase and merge" using the arrow on the right of the green button
- Don't forget to remove the remote branch after the merge



### IDE configuration

Atom Editor is used for developments

Following Atom modules should be installed :

#### Recommanded modules :

```
apm install react
apm install atom-react-autocomplete
```

#### Required modules :

```
apm install editorconfig
apm install linter
apm install linter-eslint
apm install atom-beautify
apm install linter-lesshint
```

For atom-beautify, on settings, activate "Beautify on save" for JS, JSX, HTML and CSS

## Production deployment

### Requirements

The following tools need to be installed on the developer's computer to be able to deploy the app :

- gcloud
- docker (optional)

#### install gcloud command

- Follow https://cloud.google.com/sdk/docs/
- `gcloud components update`
- `gcloud components install beta`
- `gcloud init`

### Steps to deploy

__Warning :__ The deployment script will deploy the app as it is currently in your local computer ! So, if you have local changes not committed yet or if you are in a custom branch, it is this code which will be deployed and not the latest commit from the `master` branch !

- Cleanup your local version of the project
- Open a terminal and `cd <projectRoot>`
- Make sure that the app is correctly working in production mode on your local computer by doing `node app.js --prod`
- Make sure that `config/env/production.js` is in your project. _Otherwise ask an other Wikicaves developer for this file which is not check'in to the project because it contains the database credentials._
- Run `./localDeploy.sh` and verify that everything is working correctly on the app deployed in your local docker.
- [Optional] Run `./DBDeploy.sh [GC2_SSH_USER] [GC2_SSH_PORT] false` to deploy the grottocenter 2 database content to your local docker and test the app with real data.
- Deploy in production by doing `./appEngineDeploy.sh`
- Wait for the complete deployment and then verify online that everything works well on the production application.
- [Optional] Run `./DBDeploy.sh [GC2_SSH_USER] [GC2_SSH_PORT] true` to deploy the grottocenter 2 database content to the cloud SQL production database (the previous GC3 database will be overwritten).

## Technical choices

### Database

MySQL v5.0

`npm install sails-mysql --save`

We use the built-in Waterline ORM

### Front layer

Babel

`npm install grunt-babel babel-preset-es2015 babel-preset-react --save`

Bootstrap v3

HTML5 + CSS3

### JSON Web Token authentication

For API access control, JWT is used

`npm install jsonwebtoken --save`

### User authentication

`npm install passport passport-local bcryptjs validator --save`

Use sails-generate-auth (abandoned??) or sails-auth to manage the login process with passport.

### Swagger (interface to our API)

```
npm install swagger-ui --save
```
Disable /swagger in csrf.js

Run automatically by grunt tasks :

    - Copy node_modules/swagger-ui/dist/* in assets/swagger/
    - Update assets/swagger/index.html with the url of the json generated by swagger for our API


Access to API list with :
    http://localhost:1337/ui/api/


### Testing

Mocha + Barrels

`npm install mocha supertest barrels sails-memory should`

## Useful sails commands

### Create Sails app from scratch

Install nodeJS

`npm -g install sails`
`sails new <myApp>`

### Add a module on package file

`cd /PATH/TO/<myApp>`
`npm install sails-mysql --save`

### Generate model and controller

`sails generate api <model-name>`

### Upgrade a component

SailsJS:

`npm update -g sails`

Any sails module:

`npm update sails-mysql`

### Run tests

`npm test`
