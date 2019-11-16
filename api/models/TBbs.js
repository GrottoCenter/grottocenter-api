/**
 * TBbs.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 't_bbs',
  primaryKey: 'id',

  attributes: {
    id : {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'XrefNumeriqueFinal'
    },

    ref_: {
      type: 'number',
      columnName: 'ref_'
    },

    articleTitle: {
      type: 'string',
      maxLength: 1000,
      columnName: 'ArticleTitle'
    },

    articleYear: {
      type: 'number',
      columnName: 'ArticleYear'
    },

    publicationExport: {
      type: 'string',
      maxLength: 1000,
      columnName: 'publication_export'
    },

    abstract: {
      type: 'string',
      maxLength: 10000,
      columnName: 'Abstract'
    },

    crosChapRebuilt: {
      type: 'string',
      maxLength: 100,
      columnName: 'cros_chap_rebuilt'
    },

    crosCountryRebuilt: {
      type: 'string',
      maxLength: 100,
      columnName: 'cros_country_rebuilt'
    },

    cAuthorsFull: {
      type: 'string',
      maxLength: 1000,
      columnName: 'cAuthorsFull'
    },

    chapter: {
      columnName: 'ChapterCode',
      model: 'TBbsChapter'
    },

    country: {
      columnName: 'CountryCode',
      model: 'TBbsGeo'
    }
    
  }

};
