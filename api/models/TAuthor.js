/**
 * TAuthor.js
 *
 * @description :: tAuthor model imported from localhost MySql server at 4/3/2016 23:47:21.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

module.exports = {

  tableName: 't_author',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id'
    },

    idAuthor: {
      type: 'number',
      unique: true,
      /*primaryKey: true,*/
      columnName: 'Id_author'
    },

    dateInscription: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_inscription'
    },

    idCaver: {
      columnName: 'Id_caver',
      model: 'TCave'
    },

    name: {
      type: 'string',
      maxLength: 70,
      columnName: 'Name'
    },

    contact: {
      type: 'string',
      maxLength: 70,
      columnName: 'Contact'
    },

    creatorIsAuthor: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Creator_is_author'
    },

    validated: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Validated'
    }
  }
};
