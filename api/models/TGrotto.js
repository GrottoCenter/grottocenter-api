/**
 * TGrotto.js
 *
 * @description :: tGrotto model imported from localhost MySql server at 31/3/2016 12:7:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_grotto',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id',
    },
    locked: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Locked',
    },
    author: {
      columnName: 'Id_author',
      model: 'TCaver',
    },
    idReviewer: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_reviewer',
      allowNull: true,
    },
    idLocker: {
      type: 'string',
      maxLength: 5,
      columnName: 'Id_locker',
      allowNull: true,
    },
    name: {
      type: 'string',
      maxLength: 36,
      columnName: 'Name',
    },
    country: {
      type: 'string',
      maxLength: 3,
      columnName: 'Country',
    },
    region: {
      type: 'string',
      maxLength: 32,
      columnName: 'Region',
      allowNull: true,
    },
    city: {
      type: 'string',
      maxLength: 32,
      columnName: 'City',
      allowNull: true,
    },
    postalCode: {
      type: 'string',
      maxLength: 5,
      columnName: 'Postal_code',
      allowNull: true,
    },
    address: {
      type: 'string',
      maxLength: 128,
      columnName: 'Address',
      allowNull: true,
    },
    contact: {
      type: 'string',
      maxLength: 40,
      columnName: 'Contact',
      allowNull: true,
    },
    yearBirth: {
      type: 'string',
      maxLength: 4,
      columnName: 'Year_birth',
      allowNull: true,
    },
    dateInscription: {
      type: 'ref',
      columnType: 'datetime',
      columnName: 'Date_inscription',
    },
    dateReviewed: {
      type: 'ref',
      columnType: 'datetime',
      columnName: 'Date_reviewed',
    },
    dateLocked: {
      type: 'ref',
      columnType: 'datetime',
      columnName: 'Date_locked',
    },
    idPresident: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_president',
      allowNull: true,
    },
    idVicePresident: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_vice_president',
      allowNull: true,
    },
    idTreasurer: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_treasurer',
      allowNull: true,
    },
    idSecretary: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Id_secretary',
      allowNull: true,
    },
    latitude: {
      type: 'number',
      columnName: 'Latitude',
    },
    longitude: {
      type: 'number',
      columnName: 'Longitude',
    },
    customMessage: {
      type: 'string',
      columnName: 'Custom_message',
      allowNull: true,
    },
    pictureFileName: {
      type: 'string',
      maxLength: 100,
      columnName: 'Picture_file_name',
      allowNull: true,
    },
    isOfficialPartner: {
      type: 'boolean',
      columnName: 'Is_official_partner',
      allowNull: true,
    },
    village: {
      type: 'string',
      maxLength: 100,
      columnName: 'Village',
      allowNull: true,
    },
    county: {
      type: 'string',
      maxLength: 100,
      columnName: 'County',
      allowNull: true,
    },

    cavers: {
      collection: 'TCaver',
      via: 'grotto',
      through: 'JGrottoCaver',
    },
    entries: {
      collection: 'TEntry',
      via: 'grotto',
      through: 'JGrottoEntry',
    },
  },
};
