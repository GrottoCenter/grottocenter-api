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

Clone the project on your computer:
```
> git clone https://github.com/GrottoCenter/Grottocenter3.git
```

## Usage

### Demonstration deployment

The demonstration deployment aims to launch locally an instance of Grottocenter to demonstrate its features.

Start the project:
```
> ./deployDemo.sh
```
Then go to [homepage](http://localhost:1337/)
Or access to [API documentation](http://localhost:1337/ui/api/) for example.

### Development deployment

The development deployment aims to launch locally all the tools needed for the Grottocenter development.

Start the project:
```
> ./deployDev.sh
> npm install
```

Finally, run the server with live-reloading using:
```
> npm run start-hot
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

Yon can also join us on Slack! (using the QR-code above)

~~For more details, read [the development guide](https://github.com/GrottoCenter/Grottocenter3/wiki/Development-guide)~~ ==> DEPRECATED

## Licence

