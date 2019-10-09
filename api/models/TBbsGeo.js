/**
 * TBbsGeo.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 't_bbs_geo',
  primaryKey: 'code',

  attributes: {    
    code: {
      type: 'string',
      unique: true,
      autoIncrement: true,
      columnName: 'Code'
    },

    country: {
      type: 'string',
      maxLength: 1000,
      columnName: 'Country'
    },

    espagnol: {
      type: 'string',
      maxLength: 1000,
      columnName: 'Espagnol'
    },

    francais: {
      type: 'string',
      maxLength: 1000,
      columnName: 'Francais'
    },

    italien: {
      type: 'string',
      maxLength: 1000,
      columnName: 'Italien'
    },

    texteTitrePays: {
      type: 'string',
      maxLength: 1000,
      columnName: 'texte_titre_pays'
    },

    texteTitreRegion: {
      type: 'string',
      maxLength: 1000,
      columnName: 'texte_titre_region'
    },
  },

};

