/**
 * TComment.js
 *
 * @description :: tComment model imported from localhost MySql server at 8/11/2016 19:7:20.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

module.exports = {

  tableName: 't_comment',

  attributes: {
    id: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      autoIncrement: true,
      columnName: 'Id'
    },
    locked: {
      type: 'text',
      required: true,
      defaultsTo: 'NO',
      columnName: 'Locked'
    },
    idAuthor: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      columnName: 'Id_author'
    },
    idAnswered: {
      type: 'integer',
      index: true,
      columnName: 'Id_answered'
    },
    idReviewer: {
      type: 'integer',
      index: true,
      columnName: 'Id_reviewer'
    },
    idLocker: {
      type: 'integer',
      columnName: 'Id_locker'
    },
    dateInscription: {
      type: 'datetime',
      columnName: 'Date_inscription'
    },
    dateReviewed: {
      type: 'datetime',
      columnName: 'Date_reviewed'
    },
    dateLocked: {
      type: 'datetime',
      columnName: 'Date_locked'
    },
    entry: {
      columnName: 'Id_entry',
      model: 'TEntry'
    },
    idExit: {
      type: 'integer',
      unique: true,
      primaryKey: true,
      required: true,
      defaultsTo: '0',
      columnName: 'Id_exit'
    },
    relevance: {
      type: 'float',
      required: true,
      defaultsTo: '1',
      columnName: 'Relevance'
    },
    eTUnderground: {
      type: 'time',
      columnName: 'E_t_underground'
    },
    eTTrail: {
      type: 'time',
      columnName: 'E_t_trail'
    },
    aestheticism: {
      type: 'string',
      size: 5,
      columnName: 'Aestheticism'
    },
    caving: {
      type: 'float',
      columnName: 'Caving'
    },
    approach: {
      type: 'float',
      columnName: 'Approach'
    },
    title: {
      type: 'string',
      size: 300,
      columnName: 'Title'
    },
    body: {
      type: 'text',
      columnName: 'Body'
    },
    alert: {
      type: 'text',
      required: true,
      defaultsTo: 'NO',
      columnName: 'Alert'
    }
  }
};
