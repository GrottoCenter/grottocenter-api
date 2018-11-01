/**
 * TType.js
 *
 * @description :: tType model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

module.exports = {

  tableName: 't_type',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id'
    },
    frType: {
      type: 'string',
      maxLength: 100,
      columnName: 'Fr_type'
    },
    enType: {
      type: 'string',
      maxLength: 100,
      columnName: 'En_type'
    },
    esType: {
      type: 'string',
      maxLength: 100,
      columnName: 'Es_type'
    },
    deType: {
      type: 'string',
      maxLength: 100,
      columnName: 'De_type'
    },
    bgType: {
      type: 'string',
      maxLength: 100,
      required: true,
      columnName: 'Bg_type'
    },
    nlType: {
      type: 'string',
      maxLength: 100,
      required: true,
      columnName: 'Nl_type'
    },
    caType: {
      type: 'string',
      maxLength: 100,
      required: true,
      columnName: 'Ca_type'
    },
    itType: {
      type: 'string',
      maxLength: 100,
      required: true,
      columnName: 'It_type'
    }
  }
};
