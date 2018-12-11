/**
 * TGrotto.js
 *
 * @description :: tGrotto model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';
module.exports = {

  tableName: 't_grotto',

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
    author: {
      columnName: 'Id_author',
      model: 'TCaver'
    },
    idReviewer: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_reviewer'
    },
    idLocker: {
      type: 'string',
      maxLength: 5,
      columnName: 'Id_locker'
    },
    name: {
      type: 'string',
      maxLength: 36,
      columnName: 'Name'
    },
    country: {
      type: 'string',
      maxLength: 3,
      columnName: 'Country'
    },
    region: {
      type: 'string',
      maxLength: 32,
      columnName: 'Region'
    },
    city: {
      type: 'string',
      maxLength: 32,
      columnName: 'City'
    },
    postalCode: {
      type: 'string',
      maxLength: 5,
      columnName: 'Postal_code'
    },
    address: {
      type: 'string',
      maxLength: 128,
      columnName: 'Address'
    },
    contact: {
      type: 'string',
      maxLength: 40,
      columnName: 'Contact'
    },
    yearBirth: {
      type: 'string',
      maxLength: 4,
      columnName: 'Year_birth'
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
    idPresident: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_president'
    },
    idVicePresident: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_vice_president'
    },
    idTreasurer: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_treasurer'
    },
    idSecretary: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_secretary'
    },
    latitude: {
      type: 'number',
      columnName: 'Latitude'
    },
    longitude: {
      type: 'number',
      columnName: 'Longitude'
    },
    customMessage: {
      type: 'string',
      columnName: 'Custom_message'
    },
    pictureFileName: {
      type: 'string',
      maxLength: 100,
      columnName: 'Picture_file_name'
    },
    isOfficialPartner: {
      type: 'boolean',
      columnName: 'Is_official_partner'
    },
    village: {
      type: 'string',
      maxLength: 100,
      columnName: 'Village'
    },
    county: {
      type: 'string',
      maxLength: 100,
      columnName: 'County'
    },

    cavers: {
      collection: 'TCaver',
      via: 'grotto',
      through: 'JGrottoCaver'
    },
    entries: {
      collection: 'TEntry',
      via: 'grotto',
      through: 'JGrottoEntry'
    },
  }
};
