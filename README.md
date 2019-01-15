# Grottocenter 3

The Wiki database made by cavers for cavers!

Current production version is available [here](http://beta.grottocenter.org/)

## Project overview

[![Travis Status](https://travis-ci.org/GrottoCenter/Grottocenter3.svg?branch=rc)](https://travis-ci.org/GrottoCenter/Grottocenter3?branch=rc)
[![Coverage Status](https://coveralls.io/repos/github/GrottoCenter/Grottocenter3/badge.svg?branch=rc)](https://coveralls.io/github/GrottoCenter/Grottocenter3?branch=rc) [![Greenkeeper badge](https://badges.greenkeeper.io/GrottoCenter/Grottocenter3.svg)](https://greenkeeper.io/)

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
git clone https://github.com/GrottoCenter/Grottocenter3.git
```

## Usage

Using Docker, 3 deployment modes are possible : 
- Demonstration - Deploy the application directly to http://localhost:1337.
- Development - Set up the development environment.
- Production - Used to deploy in production.

### Demonstration deployment

```
./deployDemo.sh
```
Then go to http://localhost:1337/.

### Development deployment

Set up all the environment: 
```
./deployDev.sh
```

Finally, to launch the server with live reloading activated, run:
```
> npm run start-hot
```

### Tests

Run tests:
```
npm run test
```

Check code coverage:
```
npm run coverage
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

