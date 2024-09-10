/**
 * HCave.js
 *
 * @description :: hCave model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'h_cave',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    author: {
      allowNull: false,
      columnName: 'id_author',
      model: 'TCaver',
    },

    reviewer: {
      columnName: 'id_reviewer',
      model: 'TCaver',
    },

    min_depth: {
      type: 'number',
      columnName: 'min_depth',
      allowNull: true,
    },

    max_depth: {
      type: 'number',
      columnName: 'max_depth',
      allowNull: true,
    },

    depth: {
      type: 'number',
      columnName: 'depth',
      allowNull: true,
    },

    // Due to to an issue in sail ORM (waterline)
    // We cannot have a property named 'length' or else
    // the columnName resolution will not work anymore for this model
    // https://github.com/balderdashy/sails/issues/7106#issuecomment-1341652168
    caveLength: {
      type: 'number',
      columnName: 'length',
      allowNull: true,
    },

    isDiving: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_diving',
      defaultsTo: false,
    },

    temperature: {
      type: 'number',
      allowNull: true,
      columnName: 'temperature',
    },

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },

    dateReviewed: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_reviewed',
      columnType: 'timestamp',
    },

    // Sails' ORM, Waterline, doesn't support large number:
    // that's why we use the type 'string' for the latitude
    // Deprecated: The location of a cave is where its entrances are located.
    latitude: {
      type: 'string',
      allowNull: true,
      columnName: 'latitude',
      columnType: 'numeric(24,20)',
    },

    // Sails' ORM, Waterline, doesn't support large number:
    // that's why we use the type 'string' for the longitude
    // Deprecated: The location of a cave is where its entrances are located.
    longitude: {
      type: 'string',
      allowNull: true,
      columnName: 'longitude',
      columnType: 'numeric(24,20)',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },
  },
};
