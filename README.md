# Grottocenter API

**Grottocenter** is The Wiki database made by cavers for cavers!

This GitHub project is the backend application which provide the Grottocenter API to the grottocenter front app.

For the Front-End See the [grottocenter-front project](https://github.com/GrottoCenter/grottocenter-front)

Current production version is available [here](https://api.grottocenter.org)

## Project overview

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

### Master

![Latest Deployment](https://github.com/GrottoCenter/grottocenter-api/actions/workflows/master_grottocenter-api.yml/badge.svg)

[![Coverage Status](https://coveralls.io/repos/github/GrottoCenter/grottocenter-api/badge.svg?branch=master)](https://coveralls.io/github/GrottoCenter/grottocenter-api?branch=refs/heads/master)
[![Build](https://github.com/GrottoCenter/grottocenter-api/actions/workflows/build.yaml/badge.svg?branch=master)](https://github.com/GrottoCenter/grottocenter-api/actions/workflows/build.yaml)

### Develop

[![Coverage Status](https://coveralls.io/repos/github/GrottoCenter/grottocenter-api/badge.svg?branch=develop)](https://coveralls.io/github/GrottoCenter/grottocenter-api?branch=refs/heads/develop)
[![Build](https://github.com/GrottoCenter/grottocenter-api/actions/workflows/build.yaml/badge.svg?branch=develop)](https://github.com/GrottoCenter/grottocenter-api/actions/workflows/build.yaml)

![GC flyer](https://rawgit.com/wiki/GrottoCenter/Grottocenter3/images/afficheGC3.svg)

## Contributors

Thanks to their donations they made possible the developer of the V3 of Grottocenter:

Spéléo Club des Mémises, Frédéric Urien, Christophe Bes, Georges Messina, Philippe Henry, Bernard Thomachot, Nathan
Bartas, Benjamin Soufflet, Ferdinando Didonna, Jean Marc Mattlet, Jean-Jacques Veux, Etienne Fabre, Sandy De Wilde,
Sylvain Bélet, Félix Nilius, Didier Gignoux, Paul Guerin, Hervé Plaettner, Marius Carrière, Doc Carbur, Hard Gilles,
Herman de Swart, Francesc Boix, Kai Getrost, Frederik Bauer, F K, Martin Andy, Suzanne Jiquel, Patrick Colinet,
Association Wikicaves, Thierry Aubé, Jean Michel Faudrin, Michel Kaspruk, Yann Schneylin, Fabien Minana, Alain Gresse,
Didier Borg, Ivan Herbots, Curtis Walter, Jan Matthesius, Stephane Jaillet, Thomas Cabotiau, Sylvain Pichot, Ayoub
Nehili, CDS de l'Aude, Julio Serrano Banderas, Guillaume Cédille, Patrick Candéla, Léonard de Haro, Bruno Rouzeyre, Eric
Madelaine, Christophe Alexandre, Pierre Mouriaux, Christophe Mergalet, Daniel Caron, Christian Feuvrier, Laurent
Delbourg, Melanie Sanchez, Spéléo Club de Villeurbanne, Harold van Ingen, Jerome Fiquet, Joris Genisset, Gérald Huet
AVENTURE VERTICALE, Alexandre Faucheux, Laval Subterra, Audrey Maingue, François Purson, Eric Gautier, Guillaume Cugno,
Jean-François Foulche, Oskar Van Herreweghe, Guerard Marie, Christophe Evrard, Philippe Gerbier, Christopher Peeters,
Speleo Club de Metz, Speleo Nederland, Erik De Groef, Christian Delaire, Flemish Caving Association, Denis Pailo,
Timothée Chauviré, Claudie Serin, Eric de Valicourt, Christian Pauli, Eric Maljournal, Guilhem Navone, Laurent Blum, JM
Dedieu, Estelle Grandsagne, Marie Merlin, Pierre-Antoine Mauro, Guillaume Pla, Groupe Spéléo du Club Alpin Nîmois, Sven
Decharte, Dominique Lagrenee.

## Installation

Software requirement:

- NodeJS + NPM (v20 minimum)
- Git client (see [Git usage](#git) for configuration)
- Docker
- [docker-compose](https://docs.docker.com/compose/install/)

Clone the project on your computer and install dependencies:

```shell
$ git clone git@github.com:GrottoCenter/grottocenter-api.git
$ cd grottocenter-api
$ npm install
```

## Usage

### Development setup

The development setup aims to launch locally all tools needed for the GrottoCenter API development:
- Postgresql database containers (main + test)
- A Elasticsearch container
- A Logstash container

> All the definition for containers is located in the `docker/` folder

To launch the development setup run:
```shell
$ npm run dev:up
```

Then the Grottocenter API app can be launched using:
```shell
$ npm run dev
```

The API should now be available at http://localhost:1337/

Each time you change a file in the source code, the server is restarted automatically.

To stop the development setup you can run :

```shell
$ npm run dev:stop # Stop all containers
$ npm run dev:down # Stop and destroy all containers
```
## Development

Caver's community needs YOU!

Yon can also join us on Slack! (using the QR-code above)

> For more details, read [the development guide](https://github.com/GrottoCenter/Grottocenter3/wiki/Development-guide)

### Tests

Run all tests:

```shell
$ npm run test
```

Run (a) specific test(s) matching a String:

```shell
$ npm run test -- --grep "<your_partial_name_tests>"
# Example
$ npm run test -- --grep "Auth features"
```

Check code coverage:

```shell
$ npm run coverage
```
### I18n / Translation

See the wiki article [translation workflow](https://github.com/GrottoCenter/Grottocenter3/wiki/Translation-workflow)

### Data versioning

See the wiki article [Automated data versioning](https://github.com/GrottoCenter/Grottocenter3/wiki/Automated-data-versioning)

### Build

Build is run by GitHub Actions on every push. See `build.yaml` to see what is run during the build workflow.

If the build is triggered from a push on `master` then a deployment of the API to Azure App Service is automatically triggered.

### Deployment in production

Deployment is done with GitHub Actions on Azure App Service when a pull request is merged into the `develop` branch.

#### API release

Additionally, periodic release of the API can be done.

You first need to merge your changes to `master` using if possible the `git flow release start vXX.X.X` command. Don't forget to update the version number on the `swagger` file and on the `package.json` file. When the merge on master is completed, you should create a release for the newly pushed tag.

For more information see the wiki page [Production deployment](https://github.com/GrottoCenter/Grottocenter3/wiki/Production-deployment)

### ElasticSearch

See [ElasticSearch Wiki page](<https://github.com/GrottoCenter/Grottocenter3/wiki/Elasticsearch-(quick-&-advanced-search)>)


### Git

#### Workflow

This project is using the **Git Flow** workflow.

More info here : https://danielkummer.github.io/git-flow-cheatsheet/index.html

You install the git-flow CLI to help you properly use the Git Flow Workflow.

When running the `git flow init` command you should keep all the default configuration.

You should use the proper type when creating a new branch with the workflow (`feature`, `bugfix`, `hotfix`, ...).

Before pushing your branch always do a `git rebase -i` to merge unnecessary commits together.

#### Merging

- Merging a simple feature / bugfix should always be done using a **rebase fast-forward**.
- Complex features requiring multiple commits should be merged with a regular merge commit.

#### Commits

This project follows the conventional commit specification. It uses commitlint to enforce conventional commit messages.

To prevent bad commits and push, we use the Git hooks [Husky](https://github.com/typicode/husky)

**Husky** is used to:

- Verify if the commit name use the [conventional commit specification](https://www.conventionalcommits.org/)
- Do a [lint-staged](https://github.com/okonet/lint-staged)

##### Commit types

The commit linter accepts the following types:

- **feat**: Adds a new feature to the application
- **tech**: Adds a new technical feature to the application (ex: a new reusable component). Neither fixes a bug nor adds a feature
- **refactor**: Refactor a current implementation without adding a new feature or fixing a bug
- **improvement**: Improve a current implementation without adding a new feature or fixing a bug
- **fix**: A bug fix
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **test**: Adding missing or correcting existing tests
- **revert**: Reverts a previous work


## Licence

GNU Affero General Public License v3.0
