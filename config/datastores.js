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

module.exports.datastores = {

  /***************************************************************************
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
   ***************************************************************************/

  //TODO: Change the url to 'mysql://sailsuser:grottocepassword@mysqlgrotto/grottoce' for dockerization
  default: {
    adapter: require('sails-mysql'),
    url: 'mysql://root:root@localhost/grottoce'
  },

  test: {
    adapter: require('sails-disk'),
    inMemoryOnly: true
  },

  /***************************************************************************
   *                                                                          *
   * MongoDB is the leading NoSQL database.                                   *
   * http://en.wikipedia.org/wiki/MongoDB                                     *
   *                                                                          *
   * Run: npm install sails-mongo                                             *
   *                                                                          *
   ***************************************************************************/
  //'someMongodbServer': {
  //  adapter: 'sails-mongo',
  //  host: 'localhost',
  //  port: 27017,
  // user: 'username',
  // password: 'password',
  // database: 'your_mongo_db_name_here'
  //},

  /***************************************************************************
   *                                                                          *
   * PostgreSQL is another officially supported relational database.          *
   * http://en.wikipedia.org/wiki/PostgreSQL                                  *
   *                                                                          *
   * Run: npm install sails-postgresql                                        *
   *                                                                          *
   *                                                                          *
   ***************************************************************************/
  //'somePostgresqlServer': {
  //  adapter: 'sails-postgresql',
  //  host: 'YOUR_POSTGRES_SERVER_HOSTNAME_OR_IP_ADDRESS',
  //  user: 'YOUR_POSTGRES_USER',
  //  password: 'YOUR_POSTGRES_PASSWORD',
  //  database: 'YOUR_POSTGRES_DB'
  //}

};