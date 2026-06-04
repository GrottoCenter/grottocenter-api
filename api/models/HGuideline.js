/**
 * HGuideline.js
 *
 * @description :: hGuideline model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'h_guideline',

  // The real DB primary key is the composite (id, date_reviewed). Waterline
  // does not support composite primary keys, so we expose date_reviewed as the
  // model's `id` (it is the discriminator within a single guideline's history)
  // and the DB `id` column — the guideline this snapshot belongs to — as `t_id`.
  primaryKey: 'id',

  attributes: {
    // Maps to the DB `date_reviewed` column. `unique: true` here only satisfies
    // Waterline's single-column primary key requirement; uniqueness is actually
    // enforced by the composite PK (id, date_reviewed) together with `t_id`.
    id: {
      type: 'string',
      required: true,
      columnName: 'date_reviewed',
      columnType: 'timestamp',
      unique: true,
    },

    // The owning guideline (DB `id` column). Not unique on its own: a guideline
    // has many history rows, one per date_reviewed.
    t_id: {
      required: true,
      type: 'number',
      columnName: 'id',
      unique: false,
    },

    title: {
      type: 'string',
      allowNull: false,
      columnName: 'title',
      maxLength: 150,
    },

    description: {
      type: 'string',
      allowNull: true,
      columnName: 'description',
      maxLength: 500,
    },

    author: {
      allowNull: false,
      columnName: 'id_author',
      model: 'TCaver',
      required: true,
    },

    reviewer: {
      columnName: 'id_reviewer',
      model: 'TCaver',
    },

    language: {
      columnName: 'id_language',
      model: 'TLanguage',
      allowNull: false,
    },

    dateInscription: {
      type: 'ref',
      allowNull: false,
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },
  },
};
