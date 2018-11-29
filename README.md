# Grottocenter 3

The Wiki database made by cavers for cavers!

Current production version is available [here](http://beta.grottocenter.org/)

## Project overview

[![Travis Status](https://travis-ci.org/GrottoCenter/Grottocenter3.svg?branch=rc)](https://travis-ci.org/GrottoCenter/Grottocenter3?branch=rc)
[![Coverage Status](https://coveralls.io/repos/github/GrottoCenter/Grottocenter3/badge.svg?branch=rc)](https://coveralls.io/github/GrottoCenter/Grottocenter3?branch=rc)

![GC flyer](https://rawgit.com/wiki/GrottoCenter/Grottocenter3/images/afficheGC3.svg)

## Installation

Software requirement:
- NodeJS (min v8)
- NPM (min 4.1.2)
- Git client (see Git usage for configuration)
- Docker
- [grunt-cli](https://www.npmjs.com/package/grunt-cli) and [sails](https://www.npmjs.com/package/sails) installed globally via npm.

Clone the project on your computer:
```
> git clone https://github.com/GrottoCenter/Grottocenter3.git
```

## Usage

### Containers deployment
Start the project:
```
> npm install
> ./localDeploy.sh
```
Then go to [homepage](http://localhost:8081/)
Or access to [API documentation](http://localhost:8081/ui/api/)

Currently, this deployment is not intented to be used for development because the hot reloading is not possible through a Docker container.

### Development deployment
Start the project:
```
> npm install
> ./localDeploy.sh
```
We will use the DB container for the next part, that's why we need to run localDeploy.sh. Change the **config/datastores.js** default config url to *'mysql://sailsuser:grottocepassword@localhost:33060/grottoce'*.

Finally, run:
```
> sails lift
```

### Tests

Run tests:
```
> npm run test
```

Check code coverage:
```
> npm run coverage
```

For more details, read [the installation guide](https://github.com/GrottoCenter/Grottocenter3/wiki/Installation-guide)

## Developement

Caver's community needs YOU!

Software requirement:
- MySql server (v5.5)
- A Github account
- Any advanced IDE (Atom, IntelliJ, PHPStorm, SublimeText...)

To start development, you have to:
- Fork this repository on your own GitHub space
- Clone the forked project on your computer
- Edit **/config/local.js** to set up your local configuration
- Create a working branch, add your code

Yon can also join us on Slack! (using the QR-code above)

For more details, read [the development guide](https://github.com/GrottoCenter/Grottocenter3/wiki/Development-guide)

## Licence

