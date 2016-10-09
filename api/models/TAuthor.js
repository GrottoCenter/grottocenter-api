/**
 * TAuthor.js
 *
 * @description :: tAuthor model imported from localhost MySql server at 4/3/2016 23:47:21.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */


module.exports = {

  tableName: 't_author',

  attributes: {
    id: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      autoIncrement: true,
      columnName: 'Id'
    },

    idAuthor: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id_author'
    },

    dateInscription: {
      type: 'datetime',
      columnName: 'Date_inscription'
    },

    idCaver: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      required: true,
      defaultsTo: '0',
      columnName: 'Id_caver'
    },

    name: {
      type: 'string',
      size: 70,
      columnName: 'Name'
    },

    contact: {
      type: 'string',
      size: 70,
      columnName: 'Contact'
    },

    creatorIsAuthor: {
      type: 'text',
      required: true,
      defaultsTo: 'NO',
      columnName: 'Creator_is_author'
    },

    validated: {
      type: 'text',
      required: true,
      defaultsTo: 'NO',
      columnName: 'Validated'
    }
  }
};
