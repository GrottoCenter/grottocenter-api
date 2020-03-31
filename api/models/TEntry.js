/**
 * TEntry.js
 *
 * @description :: tEntry model imported from localhost MySql server at 4/3/2016 23:34:32.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_entry',

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
      isIn: ['YES', 'NO'],
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
      type: 'number',
      columnName: 'Id_locker',
      allowNull: true,
    },

    name: {
      type: 'string',
      maxLength: 100,
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

    address: {
      type: 'string',
      maxLength: 128,
      columnName: 'Address',
      allowNull: true,
    },

    yearDiscovery: {
      type: 'number',
      columnName: 'Year_discovery',
      allowNull: true,
    },

    externalUrl: {
      type: 'string',
      columnName: 'External_url',
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

    isPublic: {
      type: 'string',
      columnName: 'Is_public',
    },

    isSensitive: {
      type: 'string',
      defaultsTo: 'NO',
      columnName: 'Is_sensitive',
    },

    isOfInterest: {
      type: 'string',
      allowNull: true,
      columnName: 'Is_of_interest',
    },

    contact: {
      type: 'string',
      maxLength: 1000,
      columnName: 'Contact',
      allowNull: true,
    },

    modalities: {
      type: 'string',
      maxLength: 100,
      defaultsTo: 'NO,NO,NO,NO',
      columnName: 'Modalities',
    },

    hasContributions: {
      type: 'string',
      isIn: ['YES', 'NO'],
      defaultsTo: 'NO',
      columnName: 'Has_contributions',
    },

    latitude: {
      type: 'number',
      autoMigrations: { index: true },
      columnName: 'Latitude',
    },

    longitude: {
      type: 'number',
      columnName: 'Longitude',
    },

    altitude: {
      type: 'number',
      allowNull: true,
      columnName: 'Altitude',
    },
    quality: {
      type: 'number',
      columnName: 'Quality',
      allowNull: true,
    },

    cave: {
      columnName: 'Id_cave',
      model: 'TCave',
    },

    //
    // if singleEntry is not empty, caves is supposed to be empty
    // TODO : Add a new column in t_entry that correspond to the id of t_single_entry, currently the id of t_entry is used as foreign key.
    // id of entry corresponds to id of linked single entry if exists
    /*
    singleEntry: {
      model: 'TSingleEntry'
    },
    */

    comments: {
      collection: 'TComment',
      via: 'entry',
    },

    topographies: {
      collection: 'TTopography',
      via: 'idEntry',
      through: 'jtopoentry',
    },

    grottos: {
      collection: 'TGrotto',
      via: 'entry',
      through: 'JGrottoEntry',
    },

    massifs: {
      collection: 'TMassif',
      via: 'entry',
      through: 'JMassifCave',
    },
  },
};
