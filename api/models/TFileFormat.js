/**
 * TFileFormat.js
 *
 * @description :: tFileFormat model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_file_format',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      columnName: 'id',
      unique: true,
      required: true,
    },

    extension: {
      type: 'string',
      columnName: 'extension',
      allowNull: true,
      maxLength: 12,
    },

    comment: {
      type: 'string',
      columnName: 'comment',
      allowNull: true,
      maxLength: 250,
    },

    mimeType: {
      type: 'string',
      columnName: 'mime_type',
      maxLength: 100,
    },

    softwares: {
      type: 'string',
      columnName: 'softwares',
      allowNull: true,
      maxLength: 300,
    },
  },
};
