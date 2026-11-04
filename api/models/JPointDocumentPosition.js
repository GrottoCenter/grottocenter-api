/**
 * JPointDocumentPosition.js
 *
 * @description :: The position of a point on an SVG document (#1961): x and y
 *                 in the fixed reference frame shared by every SVG file used
 *                 for positioning within that document. One row per
 *                 (point, document), unique.
 */

module.exports = {
  tableName: 'j_point_document_position',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoIncrement: true,
      columnName: 'id',
    },

    point: {
      columnName: 'id_point',
      model: 'TPoint',
      required: true,
    },

    document: {
      columnName: 'id_document',
      model: 'TDocument',
      required: true,
    },

    x: {
      type: 'number',
      required: true,
      columnName: 'x',
      columnType: 'double precision',
    },

    y: {
      type: 'number',
      required: true,
      columnName: 'y',
      columnType: 'double precision',
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
  },
};
