/**
 * TComment.js
 *
 * @description :: tComment model imported from localhost MySql server at 8/11/2016 19:7:20.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

module.exports = {

  tableName: 't_comment',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id'
    },
    locked: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Locked'
    },
    idAuthor: {
      type: 'number',
      unique: true,
      columnName: 'Id_author'
    },
    idAnswered: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_answered'
    },
    idReviewer: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_reviewer'
    },
    idLocker: {
      type: 'number',
      columnName: 'Id_locker'
    },
    dateInscription: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_inscription'
    },
    dateReviewed: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_reviewed'
    },
    dateLocked: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_locked'
    },
    entry: {
      columnName: 'Id_entry',
      model: 'TEntry'
    },
    idExit: {
      type: 'number',
      unique: true,
      defaultsTo: 0,
      columnName: 'Id_exit'
    },
    relevance: {
      type: 'number',
      defaultsTo: 1,
      columnName: 'Relevance'
    },
    eTUnderground: {
      type: 'string',
      columnName: 'E_t_underground'
    },
    eTTrail: {
      type: 'string',
      columnName: 'E_t_trail'
    },
    aestheticism: {
      type: 'number',
      columnName: 'Aestheticism'
    },
    caving: {
      type: 'number',
      columnName: 'Caving'
    },
    approach: {
      type: 'number',
      columnName: 'Approach'
    },
    title: {
      type: 'string',
      maxLength: 300,
      columnName: 'Title'
    },
    body: {
      type: 'string',
      columnName: 'Body'
    },
    alert: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Alert'
    }
  }
};
