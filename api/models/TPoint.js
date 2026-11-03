/**
 * TPoint.js
 *
 * @description :: Geographic location for scientific observations
 */

module.exports = {
  tableName: 't_point',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
      unique: true,
    },

    author: {
      allowNull: false,
      columnName: 'id_author',
      model: 'TCaver',
    },

    reviewer: {
      columnName: 'id_reviewer',
      model: 'TCaver',
    },

    dateInscription: {
      type: 'ref',
      columnName: 'date_inscription',
      columnType: 'timestamp',
    },

    dateReviewed: {
      type: 'ref',
      columnName: 'date_reviewed',
      columnType: 'timestamp',
    },

    label: {
      type: 'string',
      allowNull: false,
      columnName: 'label',
      maxLength: 200,
    },

    latitude: {
      type: 'string',
      allowNull: true,
      columnName: 'latitude',
      columnType: 'numeric(24,20)',
    },

    longitude: {
      type: 'string',
      allowNull: true,
      columnName: 'longitude',
      columnType: 'numeric(24,20)',
    },

    cave: {
      columnName: 'id_cave',
      model: 'TCave',
    },

    // Relation A: the SVG plan the point is drawn on, and its position in that
    // SVG's own viewBox units. Set together or not at all (#1733).
    referenceDocument: {
      columnName: 'id_reference_document',
      model: 'TDocument',
    },

    x: {
      type: 'number',
      allowNull: true,
      columnName: 'x',
      columnType: 'double precision',
    },

    y: {
      type: 'number',
      allowNull: true,
      columnName: 'y',
      columnType: 'double precision',
    },

    // Relation B: the documents that reference the point (#1733).
    documents: {
      collection: 'TDocument',
      via: 'point',
    },

    observations: {
      collection: 'TObservation',
      via: 'point',
    },

    descriptions: {
      collection: 'TDescription',
      via: 'point',
    },

    names: {
      collection: 'TName',
      via: 'point',
    },

    isDeleted: {
      type: 'boolean',
      allowNull: false,
      columnName: 'is_deleted',
      defaultsTo: false,
    },
  },
};
