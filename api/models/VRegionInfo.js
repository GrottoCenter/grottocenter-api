/**
 * VRegionInfo.js
 *
 * @description :: VRegionInfo model
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'v_region_info',

  attributes: {
    id: {
      type: 'number',
      columnName: 'id',
      autoIncrement: true,
    },

    id_region: {
      type: 'string',
      columnName: 'id_region',
      required: true,
    },

    id_massif: {
      type: 'number',
      columnName: 'id_massif',
    },

    id_cave: {
      type: 'number',
      columnName: 'id_cave',
    },

    name_cave: {
      type: 'string',
      columnName: 'name_cave',
    },

    depth_cave: {
      type: 'number',
      columnName: 'depth_cave',
    },

    length_cave: {
      type: 'number',
      columnName: 'length_cave',
    },

    nb_entrances: {
      type: 'number',
      columnName: 'nb_entrances',
    },

    is_diving_cave: {
      type: 'boolean',
      columnName: 'is_diving_cave',
    },
  },
};
