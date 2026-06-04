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

    configurations: {
      collection: 'TSensorConfiguration',
      via: 'device',
    },
  },
};
