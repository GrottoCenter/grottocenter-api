/**
 * TSubstance.js
 *
 * @description :: Chemical substance reference table (e.g., Nitrate, Calcium, δ¹⁸O)
 */

module.exports = {
  tableName: 't_substance',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    name: {
      type: 'string',
      required: true,
      maxLength: 200,
      columnName: 'name',
    },

    formula: {
      type: 'string',
      allowNull: true,
      maxLength: 100,
      columnName: 'formula',
    },

    casNumber: {
      type: 'string',
      allowNull: true,
      maxLength: 20,
      columnName: 'cas_number',
    },

    externalId: {
      type: 'string',
      allowNull: true,
      maxLength: 50,
      columnName: 'external_id',
    },

    externalSource: {
      type: 'string',
      allowNull: true,
      maxLength: 50,
      columnName: 'external_source',
    },

    author: {
      model: 'TCaver',
      columnName: 'id_author',
      required: true,
    },

    dateInscription: {
      type: 'ref',
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },
  },
};
