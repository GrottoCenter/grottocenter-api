/**
* Entry.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  tableName: 'T_entry',
  autoCreatedAt: false,
  autoUpdatedAt: false,
  autoPK: false,
  attributes: {
    Id: {
      type: 'integer',
      primaryKey: true,
      required: true
    },
    Locked: {
      type: 'string',
      enum: ['YES','NO'],
      required: true,
      defaultsTo: 'NO'
    },
    Id_author: {
      type: 'integer',
      required: true,
      defaultsTo: null
    },
    Id_reviewer: {
      type: 'integer',
      defaultsTo: null
    },
    Id_locker: {
      type: 'integer',
      defaultsTo: null
    },
    Name: {
      type: 'string',
      required: true,
      defaultsTo: null
    },
    Country: {
      type: 'string',
      required: true,
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
    Address: {
      type: 'string',
      defaultsTo: null
    },
    Year_discovery: {
      type: 'integer',
      defaultsTo: null
    },
    Id_type: {
      type: 'integer',
      required: true,
      defaultsTo: '0'
    },
    External_url: {
      type: 'text',
      defaultsTo: null
    },
    Date_inscription: {
      type: 'date',
      defaultsTo: null
    },
    Date_reviewed: {
      type: 'date',
      defaultsTo: null
    },
    Date_locked: {
      type: 'date',
      defaultsTo: null
    },
    Is_public: {
      type: 'string',
      enum: ['YES','NO'],
      required: true,
      defaultsTo: null
    },
    Is_sensitive: {
      type: 'string',
      enum: ['YES','NO'],
      required: true,
      defaultsTo: 'NO'
    },
    Contact: {
      type: 'string',
      defaultsTo: null
    },
    Modalities: {
      type: 'string',
      required: true,
      defaultsTo: 'NO,NO,NO,NO'
    },
    Has_contributions: {
      type: 'string',
      enum: ['YES','NO'],
      required: true,
      defaultsTo: 'NO'
    },
    Latitude: {
      type: 'float',
      required: true,
      defaultsTo: null
    },
    Longitude: {
      type: 'float',
      required: true,
      defaultsTo: null
    },
    Altitude: {
      type: 'float',
      defaultsTo: null
    }
  }
};
