/**
 * TDevice.js
 *
 * @description :: Physical measurement device (e.g., a multi-parameter data logger)
 */

module.exports = {
  tableName: 't_device',

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

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },

    dateReviewed: {
      type: 'ref',
      columnName: 'date_reviewed',
      columnType: 'timestamp',
    },

    name: {
      type: 'string',
      allowNull: false,
      columnName: 'name',
      maxLength: 300,
    },

    brandName: {
      type: 'string',
      allowNull: true,
      columnName: 'brand_name',
      maxLength: 200,
    },

    productUrl: {
      type: 'string',
      allowNull: true,
      columnName: 'product_url',
      maxLength: 500,
    },

    manufacturerUrl: {
      type: 'string',
      allowNull: true,
      columnName: 'manufacturer_url',
      maxLength: 500,
    },

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },

    configurations: {
      collection: 'TSensorConfiguration',
      via: 'device',
    },
  },
};
