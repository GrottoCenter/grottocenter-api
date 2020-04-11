/**
 * TBbsGeo.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 't_bbs_lib',
  primaryKey: 'id',

  attributes: {
    id: {
      type: 'string',
      unique: true,
      autoIncrement: true,
      columnName: 'code_centre',
    },

    nomCentre: {
      type: 'string',
      maxLength: 500,
      columnName: 'nom_centre',
    },

    pays: {
      type: 'string',
      maxLength: 50,
      columnName: 'pays',
    },
  },
};
