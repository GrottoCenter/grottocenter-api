/**
 * VDataQualityComputeEntrance.js
 *
 * @description :: VDataQualityComputeEntrance model
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'v_data_quality_compute_entrance',

  attributes: {
    id: {
      type: 'number',
      columnName: 'id',
      autoIncrement: true,
    },

    id_entrance: {
      type: 'number',
      columnName: 'id_entrance',
      required: true,
    },

    entrance_name: {
      type: 'string',
      columnName: 'entrance_name',
    },

    id_massif: {
      type: 'number',
      columnName: 'id_massif',
    },

    id_country: {
      type: 'string',
      columnName: 'id_country',
    },

    country_name: {
      type: 'string',
      columnName: 'country_name',
    },

    general_latest_date_of_update: {
      type: 'ref',
      columnName: 'general_latest_date_of_update',
      columnType: 'timestamp',
    },

    general_nb_contributions: {
      type: 'number',
      columnName: 'general_nb_contributions',
    },

    location_latest_date_of_update: {
      type: 'ref',
      columnName: 'location_latest_date_of_update',
      columnType: 'timestamp',
    },

    location_nb_contributions: {
      type: 'number',
      columnName: 'location_nb_contributions',
    },

    description_latest_date_of_update: {
      type: 'ref',
      columnName: 'description_latest_date_of_update',
      columnType: 'timestamp',
    },

    description_nb_contributions: {
      type: 'number',
      columnName: 'description_nb_contributions',
    },

    document_latest_date_of_update: {
      type: 'ref',
      columnName: 'document_latest_date_of_update',
      columnType: 'timestamp',
    },

    document_nb_contributions: {
      type: 'number',
      columnName: 'document_nb_contributions',
    },

    rigging_latest_date_of_update: {
      type: 'ref',
      columnName: 'rigging_latest_date_of_update',
      columnType: 'timestamp',
    },

    rigging_nb_contributions: {
      type: 'number',
      columnName: 'rigging_nb_contributions',
    },

    history_latest_date_of_update: {
      type: 'ref',
      columnName: 'history_latest_date_of_update',
      columnType: 'timestamp',
    },

    history_nb_contributions: {
      type: 'number',
      columnName: 'history_nb_contributions',
    },

    comment_latest_date_of_update: {
      type: 'ref',
      columnName: 'comment_latest_date_of_update',
      columnType: 'timestamp',
    },

    comment_nb_contributions: {
      type: 'number',
      columnName: 'comment_nb_contributions',
    },

    date_of_update: {
      type: 'ref',
      columnName: 'date_of_update',
      columnType: 'timestamp',
    },
  },
};
