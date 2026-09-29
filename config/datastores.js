/* eslint-disable global-require */
/**
 * Datastores
 * (sails.config.datastores)
 *
 * A set of datastore configurations which tell Sails where to fetch or save
 * data when you execute built-in model methods like `.find()` and `.create()`.
 *
 *  > This file is mainly useful for configuring your development database,
 *  > as well as any additional one-off databases used by individual models.
 *  > Ready to go live?  Head towards `config/env/production.js`.
 *
 * For more information on configuring datastores, check out:
 * https://sailsjs.com/config/datastores
 */

// Force the pg driver to handle all timestamps in UTC. See config/pg-utc-fix.js
// for the detailed explanation.
require('./pg-utc-fix');

module.exports.datastores = {
  /** *************************************************************************
   *                                                                          *
   * Your app's default datastore.                                            *
   *                                                                          *
   * Sails apps read and write to local disk by default, using a built-in     *
   * database adapter called `sails-disk`.  This feature is purely for        *
   * convenience during development; since `sails-disk` is not designed for   *
   * use in a production environment.                                         *
   *                                                                          *
   * To use a different db _in development_, follow the directions below.     *
   * Otherwise, just leave the default datastore as-is, with no `adapter`.    *
   *                                                                          *
   * (For production configuration, see `config/env/production.js`.)          *
   *                                                                          *
   ************************************************************************** */

  // Connects as gc_app, not as the superuser: the dev server is the only thing
  // that catches a missing GRANT before production does. See sql/00_roles.sql.
  // The test suite deliberately stays on root (test/test-config.js) — its
  // container only mounts 0_initDatabase.sql, so the roles do not exist there.
  default: {
    adapter: require('sails-postgresql'),
    url: 'postgres://gc_app:gc_app@localhost:33060/grottoce',
  },

  /** *************************************************************************
   *                                                                          *
   * MongoDB is the leading NoSQL database.                                   *
   * http://en.wikipedia.org/wiki/MongoDB                                     *
   *                                                                          *
   * Run: npm install sails-mongo                                             *
   *                                                                          *
   ************************************************************************** */
  // 'someMongodbServer': {
  //  adapter: 'sails-mongo',
  //  host: 'localhost',
  //  port: 27017,
  // user: 'username',
  // password: 'password',
  // database: 'your_mongo_db_name_here'
  // },
};
