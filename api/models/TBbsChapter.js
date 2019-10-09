/**
 * TBbsChapter.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 't_bbs_chapter',
  primaryKey: 'codeMatiere',

  attributes: {    
    codeMatiere: {
      type: 'string',
      unique: true,
      autoIncrement: true,
      columnName: 'code_matiere'
    },

    cTexteChapitre: {
      type: 'string',
      maxLength: 100,
      columnName: 'cTexte_chapitre'
    },

    cTexteMatiere: {
      type: 'string',
      maxLength: 1000,
      columnName: 'cTexte_Matiere'
    },

    geographicalConnection: {
      type: 'number',
      columnName: 'geographical_connection'
    },

    texteChapitreAnglais: {
      type: 'string',
      maxLength: 1000,
      columnName: 'Texte_chapitre_anglais'
    },

    texteChapitreFrancais: {
      type: 'string',
      maxLength: 1000,
      columnName: 'Texte_chapitre_francais'
    },

    textMatiereAnglais: {
      type: 'string',
      maxLength: 1000,
      columnName: 'texte_matiere_anglais'
    },

    textMatiereFrancais: {
      type: 'string',
      maxLength: 1000,
      columnName: 'texte_matiere_francais'
    },

    textTitreChap: {
      type: 'string',
      maxLength: 1000,
      columnName: 'texte_titre_chap'
    },
  },

};

