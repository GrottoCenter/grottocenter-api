/**
 * TGuideline.js
 *
 * @description :: tGuideline model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_guideline',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    title: {
      type: 'string',
      required: true,
      allowNull: false,
      columnName: 'title',
      maxLength: 150,
    },

    description: {
      type: 'string',
      allowNull: true,
      columnName: 'description',
      maxLength: 500,
    },

    countries: {
      collection: 'TCountry',
      via: 'guideline',
      through: 'JGuidelineCountry',
    },

    regions: {
      collection: 'TISO31662',
      via: 'guideline',
      through: 'JGuidelineRegion',
    },

    massifs: {
      collection: 'TMassif',
      via: 'guideline',
      through: 'JGuidelineMassif',
    },

    author: {
      allowNull: false,
      columnName: 'id_author',
      model: 'TCaver',
      required: true,
    },

    reviewer: {
      columnName: 'id_reviewer',
      model: 'TCaver',
    },

    language: {
      columnName: 'id_language',
      model: 'TLanguage',
      allowNull: false,
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

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },
  },
};
