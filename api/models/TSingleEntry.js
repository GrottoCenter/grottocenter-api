/**
 * TSingleEntry.js
 *
 * @description :: tSingleEntry model imported from localhost MySql server at 24/1/2017 8:47:16.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'tSingleEntry',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id',
    },
    minDepth: {
      type: 'number',
      columnName: 'Min_depth',
    },
    maxDepth: {
      type: 'number',
      columnName: 'Max_depth',
    },
    depth: {
      type: 'number',
      columnName: 'Depth',
    },
    length: {
      type: 'number',
      columnName: 'Length',
    },
    isDiving: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Is_diving',
    },
    temperature: {
      type: 'number',
      columnName: 'Temperature',
    },
    // TODO : see how to materialize fact that
    // id of singleEntry corresponds to id of linked entry
    /*
    entry: {
      model: 'TEntry'
    }
    */
  },
};
