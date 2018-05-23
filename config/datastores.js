/**
 * THIS FILE WAS ADDED AUTOMATICALLY by the Sails 1.0 app migration tool.
 */

module.exports.datastores = {

  // In previous versions, datastores (then called 'connections') would only be loaded
  // if a model was actually using them.  Starting with Sails 1.0, _all_ configured
  // datastores will be loaded, regardless of use.  So we'll only include datastores in
  // this file that were actually being used.  Your original `connections` config is
  // still available as `config/connections-old.js.txt`.

  'grottoceMysqlDev': {
    migrate: 'safe',
    adapter: 'sails-mysql',
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'grottoce',
    timezone: 'utc'
  },

  /*'grottoceMysqlLocalDocker': {
    migrate: 'safe',
    adapter: 'sails-mysql',
    // See "docker link" env variables : https://docs.docker.com/engine/userguide/networking/default_network/dockerlinks/#/environment-variables
    host: process.env.MYSQLGROTTO_PORT_3306_TCP_ADDR,
    user: 'sailsuser',
    password: 'grottocepassword',
    database: 'grottoce',
    timezone: 'utc'
  },

  'grottoceMysqlProd': {
    migrate: 'safe',
    adapter: 'sails-mysql',
    socketPath: '',
    user: '',
    password: '',
    database: 'grottoce',
    timezone: 'utc'
  },*/

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

  /***************************************************************************
   *                                                                          *
   * More adapters: https://github.com/balderdashy/sails                      *
   *                                                                          *
   ***************************************************************************/
};
