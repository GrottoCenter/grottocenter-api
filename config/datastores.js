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

// Force the pg driver to handle all timestamps in UTC. Without this, on
// machines with a non-UTC timezone:
// - Write side: dates are serialized using the local offset, storing e.g.
//   20:00 (CEST) instead of 18:00 (UTC) in timestamp without time zone columns.
// - Read side: values from timestamp without time zone columns are interpreted
//   as local time, subtracting the offset and returning a Date 2h earlier.
// Both cause mismatches with Postgres now() which always returns UTC.
//
// Production runs in UTC so this is a no-op there — it only corrects behavior
// on developer machines with non-UTC system clocks.
//
// sails-postgresql delegates to machinepack-postgresql which bundles its own
// pg instance. We must configure THAT instance, not just the top-level pg.
// eslint-disable-next-line import/no-extraneous-dependencies
const pg = require('pg');
// eslint-disable-next-line import/no-extraneous-dependencies
const mpPg = require('machinepack-postgresql/node_modules/pg');

[pg, mpPg].forEach((driver) => {
  // eslint-disable-next-line no-param-reassign
  driver.defaults.parseInputDatesAsUTC = true;
  driver.types.setTypeParser(1114, (str) => new Date(`${str}Z`));
});

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

  default: {
    adapter: require('sails-postgresql'),
    url: 'postgres://root:root@localhost:33060/grottoce',
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
