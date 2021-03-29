# Grottocenter 3

The Wiki database made by cavers for cavers!

Current production version is available [here](http://beta.grottocenter.org/)

## Project overview

### Master
![Latest Deployment](https://github.com/GrottoCenter/Grottocenter3/actions/workflows/deploy-aws.yml/badge.svg?branch=master)

![Latest Build](https://github.com/GrottoCenter/Grottocenter3/actions/workflows/build.yml/badge.svg?branch=master)

[![Coverage Status](https://coveralls.io/repos/github/GrottoCenter/Grottocenter3/badge.svg?branch=master)](https://coveralls.io/github/GrottoCenter/Grottocenter3?branch=master)

### Develop
![Latest Build](https://github.com/GrottoCenter/Grottocenter3/actions/workflows/build.yml/badge.svg?branch=develop)

[![Coverage Status](https://coveralls.io/repos/github/GrottoCenter/Grottocenter3/badge.svg?branch=develop)](https://coveralls.io/github/GrottoCenter/Grottocenter3?branch=develop)


[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

![GC flyer](https://rawgit.com/wiki/GrottoCenter/Grottocenter3/images/afficheGC3.svg)

## Contributors
Thanks to their donations they made possible the developer of the V3 of Grottocenter:
Spéléo Club des Mémises, Frédéric Urien, Christophe Bes, Georges Messina, Philippe Henry, Bernard Thomachot, Nathan Bartas, Benjamin Soufflet, Ferdinando Didonna, Jean Marc Mattlet, Jean-Jacques Veux, Etienne Fabre, Sandy De Wilde, Sylvain Bélet, Félix Nilius,
Didier Gignoux, Paul Guerin, Hervé Plaettner, Marius Carrière, Doc Carbur, Hard Gilles, Herman de Swart, Francesc Boix, Kai Getrost, Frederik Bauer, F K, Martin Andy, Suzanne Jiquel, Patrick Colinet, Association Wikicaves, Thierry Aubé, Jean Michel Faudrin, Michel Kaspruk, Yann Schneylin, Fabien Minana, Alain Gresse, Didier Borg, Ivan Herbots, Curtis Walter, Jan Matthesius, Stephane Jaillet, Thomas Cabotiau, Sylvain Pichot, Ayoub Nehili, CDS de l'Aude, Julio Serrano Banderas, Guillaume Cédille, Patrick Candéla, Léonard de Haro, Bruno Rouzeyre, Eric Madelaine, Christophe Alexandre, Pierre Mouriaux, Christophe Mergalet, Daniel Caron, Christian Feuvrier, Laurent Delbourg, Melanie Sanchez, Spéléo Club de Villeurbanne, Harold van Ingen, Jerome Fiquet, Joris Genisset, Gérald Huet AVENTURE VERTICALE, Alexandre Faucheux, Laval Subterra, Audrey Maingue, François Purson, Eric Gautier, Guillaume Cugno, Jean-François Foulche, Oskar Van Herreweghe, Guerard Marie, Christophe Evrard, Philippe Gerbier, Christopher Peeters, Speleo Club de Metz, Speleo Nederland, Erik De Groef, Christian Delaire, Flemish Caving Association, Denis Pailo, Timothée Chauviré, Claudie Serin, Eric de Valicourt, Christian Pauli, Eric Maljournal, Guilhem Navone, Laurent Blum, JM Dedieu, Estelle Grandsagne, Marie Merlin, Pierre-Antoine Mauro, Guillaume Pla, Groupe Spéléo du Club Alpin Nîmois, Sven Decharte, Dominique Lagrenee.

## Installation

Software requirement:
- NodeJS (min v8)
- NPM (min 4.1.2)
- Git client (see Git usage for configuration)
- Docker
- SailsJS (min v1)
- Grunt

Clone the project on your computer:
```
> git clone https://github.com/GrottoCenter/Grottocenter3.git
```

## Usage

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

## Development

Caver's community needs YOU!

Yon can also join us on Slack! (using the QR-code above)

~~For more details, read [the development guide](https://github.com/GrottoCenter/Grottocenter3/wiki/Development-guide)

## Git
#### Workflow
This project is using the **Git Flow** workflow.

More info here : https://danielkummer.github.io/git-flow-cheatsheet/index.html

You install the git-flow CLI to help you properly use the Git Flow Workflow.

When running the `git flow init` command you should keep all the default configuration.

You should use the proper type when creating a new branch with the workflow (`feature`, `bugfix`, `hotfix`, ...).

Before pushing your branch always de a `git rebase -i` to merge unnecessary commits together.

#### Merging
- Merging a simple feature / bugfix should always be done using a **rebase fast-forward**.
- Complex features requiring multiple commits should be merged with a regular merge commit.

#### Overview
This project follows the conventional commit specification. It uses commitlint to enforce conventional commit messages.

##### Hooks
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

## I18n / Translation
See the wiki article [translation workflow](https://github.com/GrottoCenter/Grottocenter3/wiki/Translation-workflow)

## Data versioning
See the wiki article [AUtomated data versioning](https://github.com/GrottoCenter/Grottocenter3/wiki/Automated-data-versioning)

## Build
Build is run by Github Actions on every push. See `build.yaml` to see what is run during the build workflow.

If the build is triggered from a push on `master` then this workflow generates an artifact (`latest.tar.gz`) which is temporary stored on github for 1 day and permanently stored on AWS S3 for production deployment.

## Deployment in production
Deployment done with Github Actions and AWS CodeDeploy.

To Deploy you need to run manually the Actions workflow `Deploy to beta.grottocenter.org` on the `master` branch from the Github Actions page.

If you trigger the deployment workflow manually, the execution will be paused until an administrator validate it.

For more information see the wiki page [Production deployment](https://github.com/GrottoCenter/Grottocenter3/wiki/Production-deployment)

## React tools
##### storybook

[Storybook](https://storybook.js.org/) is used to develop in isolation UI component.
It can be start independently with `npm run storybook`

## ElasticSearch
See [ElastiSearch Wiki page](https://github.com/GrottoCenter/Grottocenter3/wiki/Elasticsearch-(quick-&-advanced-search))
## Licence

GNU Affero General Public License v3.0
