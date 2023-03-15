/**
 * TISO31662.js
 *
 * @description :: TISO31662 model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 't_iso3166_2',

  attributes: {
    id: {
      type: 'string',
      allowNull: false,
      columnName: 'iso',
      unique: true,
      required: true,
      maxLength: 10,
    },

    name: {
      type: 'string',
      allowNull: false,
      columnName: 'name',
      maxLength: 200,
    },

    nameAr: {
      type: 'string',
      columnName: 'name_ar',
      allowNull: true,
      maxLength: 200,
    },

    nameBg: {
      type: 'string',
      columnName: 'name_bg',
      allowNull: true,
      maxLength: 200,
    },

    nameCa: {
      type: 'string',
      columnName: 'name_ca',
      allowNull: true,
      maxLength: 200,
    },

    nameDe: {
      type: 'string',
      columnName: 'name_de',
      allowNull: true,
      maxLength: 200,
    },

    nameEl: {
      type: 'string',
      columnName: 'name_el',
      allowNull: true,
      maxLength: 200,
    },

    nameEn: {
      type: 'string',
      columnName: 'name_en',
      allowNull: true,
      maxLength: 200,
    },

    nameEs: {
      type: 'string',
      columnName: 'name_es',
      allowNull: true,
      maxLength: 200,
    },

    nameFr: {
      type: 'string',
      columnName: 'name_fr',
      allowNull: true,
      maxLength: 200,
    },

    nameHe: {
      type: 'string',
      columnName: 'name_he',
      allowNull: true,
      maxLength: 200,
    },

    nameId: {
      type: 'string',
      columnName: 'name_id',
      allowNull: true,
      maxLength: 200,
    },

    nameIt: {
      type: 'string',
      columnName: 'name_it',
      allowNull: true,
      maxLength: 200,
    },

    nameJa: {
      type: 'string',
      columnName: 'name_ja',
      allowNull: true,
      maxLength: 200,
    },

    nameNl: {
      type: 'string',
      columnName: 'name_nl',
      allowNull: true,
      maxLength: 200,
    },

    namePt: {
      type: 'string',
      columnName: 'name_pt',
      allowNull: true,
      maxLength: 200,
    },

    nameRo: {
      type: 'string',
      columnName: 'name_ro',
      allowNull: true,
      maxLength: 200,
    },
  },
};
