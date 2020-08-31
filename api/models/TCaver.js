/**
 * TCaver.js
 *
 * @description :: tCaver model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

const crypto = require('crypto');

// 01/2018 C. ROIG : remove RGPD fields (see sql/20181231_del_fields.sql)
module.exports = {
  tableName: 't_caver',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    login: {
      type: 'string',
      columnName: 'login',
      maxLength: 20,
      unique: true,
    },

    password: {
      type: 'string',
      columnName: 'password',
      maxLength: 64,
    },

    activated: {
      type: 'boolean',
      columnName: 'activated',
      defaultsTo: false,
    },

    activationCode: {
      type: 'string',
      allowNull: false,
      columnName: 'activation_code',
      maxLength: 64,
    },

    banned: {
      type: 'boolean',
      columnName: 'banned',
      defaultsTo: false,
    },

    connectionCounter: {
      type: 'number',
      allowNull: false,
      columnName: 'connection_counter',
      defaultsTo: 0,
    },

    relevance: {
      type: 'number',
      allowNull: false,
      columnName: 'relevance',
      defaultsTo: 1,
    },

    name: {
      type: 'string',
      allowNull: true,
      maxLength: 36,
      columnName: 'name',
    },

    surname: {
      type: 'string',
      allowNull: true,
      columnName: 'surname',
      maxLength: 32,
    },

    nickname: {
      type: 'string',
      columnName: 'nickname',
      maxLength: 68,
    },

    mail: {
      type: 'string',
      allowNull: false,
      columnName: 'mail',
      maxLength: 50,
    },

    mailIsValid: {
      type: 'boolean',
      allowNull: false,
      columnName: 'mail_is_valid',
      defaultsTo: true,
    },

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'datetime',
    },

    dateLastConnection: {
      type: 'ref',
      columnName: 'date_last_connection',
      columnType: 'datetime',
    },

    alertForNews: {
      type: 'boolean',
      allowNull: false,
      columnName: 'alert_for_news',
      defaultsTo: false,
    },

    showLinks: {
      type: 'boolean',
      allowNull: false,
      columnName: 'show_links',
      defaultsTo: false,
    },

    detailLevel: {
      type: 'number',
      allowNull: true,
      columnName: 'detail_level',
    },

    defaultZoom: {
      type: 'number',
      allowNull: true,
      columnName: 'default_zoom',
    },

    language: {
      allowNull: false,
      columnName: 'id_language',
      model: 'TLanguage',
    },

    grottos: {
      collection: 'TGrotto',
      via: 'caver',
      through: 'JGrottoCaver',
    },

    documents: {
      collection: 'TDocument',
      via: 'caver',
      through: 'JDocumentCaverAuthor',
    },
  },

  customToJSON: () => {
    // Removing password on JSON object
    return _.omit(this, ['password']);
  },

  beforeCreate: (values, next) => {
    // TODO commented to remove ESlint warning because hash is not defined.
    // values.password = hash;
    next();
  },

  comparePassword: (password, user, next) => {
    const hash = crypto
      .createHash('md5')
      .update(password)
      .digest('hex');

    if (hash === user.password) {
      next(null, true);
    } else {
      next(null, false);
    }
  },
};
