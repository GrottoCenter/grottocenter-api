/**
 * TSingleEntry.js
 *
 * @description :: tSingleEntry model imported from localhost MySql server at 24/1/2017 8:47:16.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = {

  tableName: 'tSingleEntry',

  attributes: {
    id: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id'
    },
    minDepth: {
      type: 'float',
      columnName: 'Min_depth'
    },
    maxDepth: {
      type: 'float',
      columnName: 'Max_depth'
    },
    depth: {
      type: 'float',
      columnName: 'Depth'
    },
    length: {
      type: 'float',
      columnName: 'Length'
    },
    isDiving: {
      type: 'text',
      defaultsTo: 'NO',
      columnName: 'Is_diving'
    },
    temperature: {
      type: 'float',
      columnName: 'Temperature'
    },
    // TODO : see how to materialize fact that
    // id of singleEntry corresponds to id of linked entry
    /*entry: {
      model: 'TEntry'
    }*/
  }
};
