# Grottocenter 3

The Wiki database made by cavers for cavers
A [Sails](http://sailsjs.org) application

## Installation :

### Install NodeJS

Min version: 6.9.4

### Install NPM (package manager)

Min version: 4.1.2

### Get source code

GitHub repository
https://github.com/GrottoCenter/Grottocenter3.git

### Install packages

`npm install`

### Run the app locally

`cd <root of the project>`
`sails lift`

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

Deployment to production has been tested with Compute Engine using a shell script with docker-machine and gcloud. 
This solution was not reliable because of certificat issues between Google Cloud and docker-machine.

Then the deployment to production has been tested with Google App Engine. This solution was easy and fast but expensive (40$/month). Indeed, it is not possible to choose a micro instance with App Engine.

We are now deploying to production on a a compute Engine by using the Google Container builder (Continuous Integration tool).

### Requirements

The following tools need to be installed on the developer's computer to be able to deploy the app :

- gcloud (optional)
- docker (optional)

#### install gcloud command (optional)

- Follow https://cloud.google.com/sdk/docs/
- `gcloud components update`
- `gcloud components install beta`
- `gcloud init`

### Google Container Builder explanation

The build and deployment of the Grottocenter 3 application is done automatically by Google Container Builder.
A build trigger based on the tag of the github repository has been setup on Google Container Builder (https://console.cloud.google.com/gcr/triggers)
This trigger will start the cloud build which is defined in the `cloudbuild.yaml` file.
Sensitive files containing password are stored in a private cloud storage and are retrieved during the build.
The build will create a docker image which will be stored in the Google Container Registry with the `latest` tag and the `{GIT TAG}` tag.
The latest steps of the build delete the existing compute engine virtual server running Grottocenter3 and re-create it using the newly created docker image.
The container deployment (`docker run` command, ...) on the compute engine is defined in the `cloudinit.yaml` file.
The compute engine is using a permanent IP.

### one time Google Cloud setup for Container Builder deployment
- [1 time only] Create a static IP : `gcloud compute addresses create grottocenter-website --project grottocenter-beta --region us-east1` then use this static IP in `cloudbuild.yaml`
- Grant `Compute Engine Admin` and `service account user` access to `cloudbuild` Google APIs service account from https://console.cloud.google.com/iam-admin/iam/project?project=grottocenter-beta
- Create the Container builder Github Trigger
- store `production.js` and `.transifexrc` files in the proper Cloud Storage bucket defined in `cloudbuild.yaml`.
- Authorize the public IP of the compute Engine in Cloud SQL.

### Steps to deploy with Google Container Builder

- Commit and push your changes to the repo
- [Optional] Run `./localDeploy.sh` and verify that everything is working correctly on the app deployed in your local docker.
- [Optional] Run `./DBDeploy.sh [GC2_SSH_USER] [GC2_SSH_PORT] false` to deploy the grottocenter 2 database content to your local docker and test the app with real data.
- Add a `tag` to the commit that you want to deploy with this naming convention `v3.2.1` and don't forget to push this `tag` to `origin`.
- monitor the build and deploy on https://console.cloud.google.com/gcr/builds
- Wait for the complete deployment and then verify online that everything works well on the production application.
- [Optional] Run `./DBDeploy.sh [GC2_SSH_USER] [GC2_SSH_PORT] true` to deploy the grottocenter 2 database content to the cloud SQL production database (the previous GC3 database will be overwritten).

If you want to deploy a previous version you can re-run a previous build from https://console.cloud.google.com/gcr/builds or you can push a tag to a previous commit.
You can also use the `gcloud` command used in the `cloudbuild.yaml` from your own terminal.

### [DEPRECATED] Steps to deploy on App Engine

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
