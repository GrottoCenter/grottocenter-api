/**
 * TGrotto.js
 *
 * @description :: tGrotto model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';
module.exports = {

  tableName: 't_grotto',

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
    author: {
      columnName: 'Id_author',
      model: 'TCaver'
    },
    idReviewer: {
      type: 'integer',
      index: true,
      columnName: 'Id_reviewer'
    },
    idLocker: {
      type: 'string',
      size: 5,
      columnName: 'Id_locker'
    },
    name: {
      type: 'string',
      size: 36,
      columnName: 'Name'
    },
    country: {
      type: 'string',
      size: 3,
      columnName: 'Country'
    },
    region: {
      type: 'string',
      size: 32,
      columnName: 'Region'
    },
    city: {
      type: 'string',
      size: 32,
      columnName: 'City'
    },
    postalCode: {
      type: 'string',
      size: 5,
      columnName: 'Postal_code'
    },
    address: {
      type: 'string',
      size: 128,
      columnName: 'Address'
    },
    contact: {
      type: 'string',
      size: 40,
      columnName: 'Contact'
    },
    yearBirth: {
      type: 'string',
      size: 4,
      columnName: 'Year_birth'
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
    idPresident: {
      type: 'integer',
      index: true,
      columnName: 'Id_president'
    },
    idVicePresident: {
      type: 'integer',
      index: true,
      columnName: 'Id_vice_president'
    },
    idTreasurer: {
      type: 'integer',
      index: true,
      columnName: 'Id_treasurer'
    },
    idSecretary: {
      type: 'integer',
      index: true,
      columnName: 'Id_secretary'
    },
    latitude: {
      type: 'float',
      columnName: 'Latitude'
    },
    longitude: {
      type: 'float',
      columnName: 'Longitude'
    },
    customMessage: {
      type: 'text',
      columnName: 'Custom_message'
    },
    pictureFileName: {
      type: 'string',
      size: 100,
      columnName: 'Picture_file_name'
    },
    isOfficialPartner: {
      type: 'boolean',
      columnName: 'Is_official_partner'
    }
  }
};
