/**
 * TCaver.js
 *
 * @description :: tCaver model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

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

    // deprecated attribute: mail is prefered for login
    login: {
      type: 'string',
      columnName: 'login',
      allowNull: true,
      maxLength: 20,
    },

    password: {
      type: 'string',
      columnName: 'password',
      allowNull: true,
      maxLength: 100,
    },

    activated: {
      type: 'boolean',
      columnName: 'activated',
      defaultsTo: false,
    },

    activationCode: {
      type: 'string',
      allowNull: true,
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
      allowNull: false,
      columnName: 'nickname',
      maxLength: 68,
    },

    mail: {
      type: 'string',
      allowNull: false,
      columnName: 'mail',
      isEmail: true,
      maxLength: 50,
      unique: true,
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
      columnType: 'timestamp',
    },

    dateLastConnection: {
      type: 'ref',
      columnName: 'date_last_connection',
      columnType: 'timestamp',
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

    sendNotificationByEmail: {
      type: 'boolean',
      columnName: 'send_notification_by_email',
      defaultsTo: false,
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

    groups: {
      collection: 'TGroup',
      via: 'caver',
      through: 'JCaverGroup',
    },

    exploredEntrances: {
      collection: 'TEntrance',
      via: 'caver',
      through: 'JEntranceCaver',
    },

    subscribedToMassifs: {
      collection: 'TMassif',
      via: 'caver',
      through: 'JCaverMassifSubscription',
    },

    subscribedToCountries: {
      collection: 'TCountry',
      via: 'caver',
      through: 'JCaverCountrySubscription',
    },
  },

  // Commented because it was taking some attributes away
  // (ex: 'author' in the document model is deleted)
  // + the MappingService already ignores the password attribute
  // customToJSON: () => {
  //   return _.omit(this, ['password']); // Remove password when sending JSON
  // },

  beforeCreate: (values, next) => {
    // TODO commented to remove ESlint warning because hash is not defined.
    // values.password = hash;
    next();
  },
};
