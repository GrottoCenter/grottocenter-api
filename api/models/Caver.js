/**
* Caver.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  tableName: 'T_caver',
  autoCreatedAt: false,
  autoUpdatedAt: false,
  autoPK: false,
  attributes: {
    Id: {
      type: 'integer',
      primaryKey: true,
      required: true
    },
    Activated: {
      type: 'string',
      enum: ['YES','NO'],
      required: true,
      defaultsTo: 'NO'
    },
    Activation_code: {
      type: 'string',
      required: true,
      defaultsTo: '0'
    },
    Banned: {
      type: 'string',
      enum: ['YES','NO'],
      required: true,
      defaultsTo: 'NO'
    },
    Ip: {
      type: 'string',
      defaultsTo: null
    },
    Browser: {
      type: 'string',
      defaultsTo: null
    },
    Connection_counter: {
      type: 'integer',
      required: true,
      defaultsTo: '0'
    },
    Relevance: {
      type: 'DOUBLE',
      required: true,
      defaultsTo: '1'
    },
    Name: {
      type: 'string',
      defaultsTo: null
    },
    Surname: {
      type: 'string',
      defaultsTo: null
    },
    Login: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    Nickname: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    Password: {
      type: 'string',
      required: true,
      defaultsTo: '0'
    },
    Country: {
      type: 'string',
      defaultsTo: null
    },
    Region: {
      type: 'string',
      defaultsTo: null
    },
    City: {
      type: 'string',
      defaultsTo: null
    },
    Postal_code: {
      type: 'string',
      defaultsTo: null
    },
    Address: {
      type: 'string',
      defaultsTo: null
    },
    Date_birth: {
      type: 'date',
      defaultsTo: null
    },
    Contact: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    Year_initiation: {
      type: 'integer',
      defaultsTo: null
    },
    Date_inscription: {
      type: 'date',
      defaultsTo: null
    },
    Date_last_connection: {
      type: 'date',
      defaultsTo: null
    },
    Language: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    Contact_is_public: {
      type: 'integer',
      required: true,
      defaultsTo: '0'
    },
    Alert_for_news: {
      type: 'string',
      enum: ['YES','NO'],
      required: true,
      defaultsTo: 'NO'
    },
    Show_links: {
      type: 'string',
      enum: ['YES','NO'],
      required: true,
      defaultsTo: 'NO'
    },
    Detail_level: {
      type: 'integer',
      required: true,
      defaultsTo: '30'
    },
    Latitude: {
      type: 'float',
      required: true,
      defaultsTo: '0.00000000000000000000'
    },
    Longitude: {
      type: 'float',
      required: true,
      defaultsTo: '0.00000000000000000000'
    },
    Default_latitude: {
      type: 'float',
      defaultsTo: null
    },
    Default_longitude: {
      type: 'float',
      defaultsTo: null
    },
    Default_zoom: {
      type:  'integer',
      defaultsTo: null
    },
    Custom_message: {
      type: 'text',
      defaultsTo: null
    },
    Facebook: {
      type: 'string',
      defaultsTo: null
    },
    Picture_file_name: {
      type: 'string',
      defaultsTo: null
    }
  }
};
