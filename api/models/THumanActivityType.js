/**
 * THumanActivityType.js
 *
 * @description :: Lookup table for types of human activities (UIS ontology)
 */

module.exports = {
  tableName: 't_human_activity_type',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    code: {
      type: 'string',
      allowNull: false,
      columnName: 'code',
      maxLength: 100,
    },

    url: {
      type: 'string',
      allowNull: false,
      columnName: 'url',
      maxLength: 500,
    },
  },
};
