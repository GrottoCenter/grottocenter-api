# Grottocenter API

**Grottocenter** is The Wiki database made by cavers for cavers!

This GitHub project is the backend application which provide the Grottocenter API to the grottocenter front app.

For the Front-End See the [grottocenter-front project](https://github.com/GrottoCenter/grottocenter-front)

Current production version is available [here](https://api.grottocenter.org)

API documentation is available [here](https://api.grottocenter.org/api/v1/swagger.yaml)

Health endpoint documentation is available [here](HEALTH_ENDPOINT.md)

## Project overview

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v2/monitor/29psh.svg)](https://wikicaves.betteruptime.com)

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

- NodeJS + NPM (v24 minimum)
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
- A Typesense container (search)

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
$ npm run dev:clean # Stop and destroy all containers, delete all volumes and restart fresh
```
## Development

Caver's community needs YOU!

Yon can also join us on Slack: [https://grottocenter.slack.com](https://grottocenter.slack.com).

> For more details, read [the development guide](https://github.com/GrottoCenter/Grottocenter3/wiki/Development-guide)

### Query the database on your local environment

Example:
```shell
docker exec grotto-postgres psql -U root -d grottoce -c "SELECT id, id_country, iso_3166_2 FROM t_entrance WHERE id_country = 'US' LIMIT 5;"
```

### Cloudflare Turnstile (anti-bot CAPTCHA)

The signup endpoint is protected by Cloudflare Turnstile. Turnstile requires a domain registered in the Cloudflare dashboard, so it **cannot be tested end-to-end on localhost with real keys** — the widget will fail to load and the front-end won't be able to generate a token.

Two options for local development:

**Option 1 — disable Turnstile** (CAPTCHA check is skipped entirely):

Set in `docker/.env`:
```
TURNSTILE_ENABLED=false
```

**Option 2 — use Cloudflare's always-pass test keys** (widget renders and tokens always validate):

Set in `docker/.env`:
```
TURNSTILE_ENABLED=true
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```
And use site key `1x0000000000000000000000000000000AA` on the front-end side.

For staging and production, `TURNSTILE_ENABLED=true` must be set alongside the real `TURNSTILE_SECRET_KEY`. The app refuses to start if `TURNSTILE_ENABLED=true` without a secret key configured.

### Refresh materialized views (development only)

The database uses materialized views for performance optimization. These views need to be refreshed periodically to reflect the latest data. In development, you can manually refresh them using the provided cron scripts:

```shell
# Copy and run the data quality refresh script (refreshes daily in production)
docker cp cron/refresh_data_quality_view_procedure.sh grotto-postgres:/tmp/
docker exec grotto-postgres chmod +x /tmp/refresh_data_quality_view_procedure.sh
docker exec grotto-postgres bash /tmp/refresh_data_quality_view_procedure.sh

# Copy and run the views refresh script (refreshes weekly in production)
docker cp cron/refresh_views_procedure.sh grotto-postgres:/tmp/
docker exec grotto-postgres chmod +x /tmp/refresh_views_procedure.sh
docker exec grotto-postgres bash /tmp/refresh_views_procedure.sh
```

These scripts refresh the following materialized views:
- `v_data_quality_compute_entrance` - Data quality metrics for entrances
- `v_massif_info` - Massif statistics and information
- `v_country_info` - Country statistics and information
- `v_region_info` - Region statistics and information

### Manual Typesense resync

The search indexes (Typesense) are automatically synced every Monday at 2 AM UTC. On first startup, if Typesense is empty, a sync is triggered automatically.

To manually trigger a resync (e.g. after fixing a data issue), connect to the production server via SSH and run the resync script.

#### 1. Connect via SSH

1. Log in to the [Azure Portal](https://portal.azure.com)
2. Navigate to the **grottocenter-api** Web App
3. Go to **Development Tools** > **SSH** > **Go**

#### 2. Run the resync script

From the SSH shell:

```shell
cd /home/site/wwwroot

# Resync all collections (Typesense only, no file export)
node scripts/resync-search.js

# Resync all collections + Azure Blob file export
node scripts/resync-search.js --export
```

The script lifts Sails, runs the sync, and exits. It creates timestamped collections in Typesense and switches aliases atomically, so there is no search downtime during the resync. Environment variables (database, Typesense, Azure) are already configured on the Web App.

### Tests

Tests run in parallel by default, with each shard using its own database
cloned from a pre-seeded template. The template is rebuilt automatically
when fixture files, models, or SQL migrations change — no manual step needed.

Run all tests (parallel):

```shell
$ npm run test
```

Run specific tests matching a pattern:

```shell
$ npm run test -- --grep "<your_partial_name_tests>"
# Example
$ npm run test -- --grep "Auth features"
```

Fail fast:
```shell
$ npm run test -- --bail
```

> **Note:** `--bail` stops the *failing shard* on its first failure, but other
> shards continue running. This is inherent to parallel execution — each shard
> is an independent Mocha process. If you need the entire suite to abort on the
> first failure, run sequentially: `npm run test:sequential -- --bail`.

Override shard count:
```shell
$ npm run test -- --shards 4
```

Run sequentially (single process, useful for debugging):
```shell
$ npm run test:sequential
```

Check code coverage (runs sequentially — slower than `npm test`):

```shell
$ npm run coverage
```

Check files below a coverage threshold:

```shell
$ npm run check-coverage        # Default: files under 90% coverage
$ npm run check-coverage 80     # Files under 80% coverage
$ npm run check-coverage 95     # Files under 95% coverage
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

### Permission System

Grottocenter API implements a Role-Based Access Control (RBAC) system with 5 user roles: Visitor, User, Leader, Moderator, and Administrator. Each role has specific permissions for accessing and modifying content.

For detailed information about roles, permissions, and implementation, see [here](PERMISSION_SYSTEM.md).

### Sortable fields

The advanced search endpoints (`POST /api/v1/advanced-search` and `POST /api/v1/advanced-search/export`) accept a `sort` parameter in the format `field:asc` or `field:desc`. Only fields that are sortable in the target entity's Typesense schema are accepted; invalid fields return a 400 error.

The source of truth for sortable fields is the `search.schema.fields` array in each entity module under `api/dbSync/entities/`. A field is sortable when:

- it has `sort: true` in its schema definition, or
- its type is numeric or boolean (`int32`, `int64`, `float`, `bool`, and their array variants), which Typesense makes sortable by default

To list all sortable fields for a given entity:

```bash
node -e "
const SORTABLE_BY_DEFAULT = ['int32','int64','float','bool','int32[]','int64[]','float[]','bool[]'];
const entities = ['organization','person','massif','cave','entrance','document'];
entities.forEach(e => {
  const mod = require('./api/dbSync/entities/' + e);
  const sortable = mod.search.schema.fields
    .filter(f => f.sort === true || SORTABLE_BY_DEFAULT.includes(f.type))
    .map(f => f.name);
  console.log(mod.search.schema.name + ': ' + sortable.join(', '));
});
"
```

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
