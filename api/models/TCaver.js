/**
 * TCaver.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
'use strict';

const crypto = require('crypto');

// 01/2018 C. ROIG : remove RGPD fields (see sql/20181231_del_fields.sql)
module.exports = {

  tableName: 't_caver',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true,
      columnName: 'Id'
    },

    activated: {
      type: 'string',
      isIn: ['YES', 'NO'],
      defaultsTo: 'NO',
      columnName: 'Activated'
    },

    activationCode: {
      type: 'string',
      maxLength: 32,
      defaultsTo: '0',
      columnName: 'Activation_code'
    },

    banned: {
      type: 'string',
      isIn: ['YES', 'NO'],
      defaultsTo: 'NO',
      columnName: 'Banned'
    },

    ip: {
      type: 'string',
      maxLength: 200,
      columnName: 'Ip'
    },

    browser: {
      type: 'string',
      maxLength: 1000,
      columnName: 'Browser'
    },

    connectionCounter: {
      type: 'number',
      defaultsTo: 0,
      columnName: 'Connection_counter'
    },

    relevance: {
      type: 'number',
      defaultsTo: 1,
      columnName: 'Relevance'
    },

    name: {
      type: 'string',
      maxLength: 36,
      columnName: 'Name'
    },

    surname: {
      type: 'string',
      maxLength: 32,
      columnName: 'Surname'
    },

    login: {
      type: 'string',
      maxLength: 20,
      columnName: 'Login'
    },

    nickname: {
      type: 'string',
      maxLength: 68,
      columnName: 'Nickname'
    },

    password: {
      type: 'string',
      maxLength: 32,
      defaultsTo: '0',
      columnName: 'Password'
    },

    country: {
      type: 'string',
      maxLength: 3,
      columnName: 'Country'
    },

    /*
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

    dateBirth: {
      type: 'string',
      columnType: 'date',
      columnName: 'Date_birth'
    },
    */

    contact: {
      type: 'string',
      maxLength: 50,
      columnName: 'Contact'
    },

    /*
    yearInitiation: {
      type: 'number',
      columnName: 'Year_initiation'
    },
    */

    dateInscription: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_inscription'
    },

    dateLastConnection: {
      type: 'string',
      columnType: 'datetime',
      columnName: 'Date_last_connection'
    },

    language: {
      type: 'string',
      maxLength: 4,
      columnName: 'Language'
    },

    contactIsPublic: {
      type: 'number',
      defaultsTo: 0,
      columnName: 'Contact_is_public'
    },

    alertForNews: {
      type: 'string',
      isIn: ['YES', 'NO'],
      defaultsTo: 'NO',
      columnName: 'Alert_for_news'
    },

    showLinks: {
      type: 'string',
      isIn: ['YES', 'NO'],
      defaultsTo: 'NO',
      columnName: 'Show_links'
    },

    detailLevel: {
      type: 'number',
      defaultsTo: 30,
      columnName: 'Detail_level'
    },

    /*
    latitude: {
      type: 'number',
      defaultsTo: 0.0,
      columnName: 'Latitude'
    },

    longitude: {
      type: 'number',
      defaultsTo: 0.0,
      columnName: 'Longitude'
    },
    */

    defaultLatitude: {
      type: 'number',
      columnName: 'Default_latitude'
    },

    defaultLongitude: {
      type: 'number',
      columnName: 'Default_longitude'
    },

    defaultZoom: {
      type: 'number',
      columnName: 'Default_zoom'
    },

    /*
    customMessage: {
      type: 'string',
      columnName: 'Custom_message'
    },

    facebook: {
      type: 'string',
      maxLength: 100,
      columnName: 'Facebook'
    },
    */

    pictureFileName: {
      type: 'string',
      maxLength: 100,
      columnName: 'Picture_file_name'
    },

    grottos: {
      collection: 'TGrotto',
      via: 'caver',
      through: 'JGrottoCaver'
    },
  },

  customToJSON: function() {
    let obj = this.toObject();
    delete obj.password; // Removing password on JSON object
    return obj;
  },

  beforeCreate: function(values, next) {
    // TODO commented to remove ESlint warning because hash is not defined.
    //values.password = hash;
    next();
  },

  comparePassword: function(password, user, next) {
    const hash = crypto.createHash('md5').update(password).digest('hex');

    if (hash === user.password) {
      next(null, true);
    } else {
      next(null, false);
    }
  }
};
