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

    // true underground, false at the surface, null when not classified yet:
    // points created before #1961 are not inferred from their cave or their
    // coordinates.
    underground: {
      type: 'boolean',
      allowNull: true,
      columnName: 'is_underground',
    },

    // The SVG documents the point is drawn on, one position per document (#1961).
    positions: {
      collection: 'JPointDocumentPosition',
      via: 'point',
    },

    // The documents attached to the point (#1733), independent of positions.
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
