const exportUtils = require('../utils');

const query = `
    SELECT
      m.id,
      m.date_inscription AS "dateInscription",
      m.date_reviewed AS "dateReviewed",
      m.id_author AS "authorId",
      a.nickname AS author,
      m.id_reviewer AS "reviewerId",
      r.nickname AS reviewer,
      n.name AS name,
      n.id_language AS language,
      COUNT(e.id)::int AS "nbEntrances",
      ST_AsGeoJSON(m.geog_polygon) AS geojson
    FROM t_massif AS m
    LEFT JOIN t_name n ON n.id_massif = m.id AND n.is_main = true
    LEFT JOIN t_caver a ON a.id = m.id_author
    LEFT JOIN t_caver r ON r.id = m.id_reviewer
    LEFT JOIN t_entrance e ON e.point_geom && m.geog_polygon::geometry AND ST_Contains(m.geog_polygon::geometry, e.point_geom) AND e.is_deleted = false
    WHERE m.is_deleted = false AND m.id ${exportUtils.ID_FILTER_PLACEHOLDER}
    GROUP BY m.id, m.geog_polygon, n.name, n.id_language, r.nickname, a.nickname
    ORDER BY m.id ASC
    ${exportUtils.PAGGING_PLACEHOLDER}
  `;

async function* processRows(source) {
  for await (const rows of source) {
    for (const row of rows) yield row;
  }
}

/* eslint-disable no-param-reassign */
function importFormater(d) {
  d.id = `${d.id}`;
  d.dateInscription = new Date(d.dateInscription).getTime();
  if (d.dateReviewed) d.dateReviewed = new Date(d.dateReviewed).getTime();
  if (d.nbEntrances) d.nbEntrances = parseInt(d.nbEntrances, 10);
  return d;
}
/* eslint-enable no-param-reassign */

module.exports = {
  name: 'massifs',
  sourceTable: 't_massif',
  shouldExportToFile: true,
  export: {
    joins: (rows) => [
      {
        table: 't_description d',
        foreignField: 'd.id_massif',
        rows,
        localField: 'descriptions',
        fields: [
          'd.title',
          'd.body',
          'd.id_language AS language',
          ...exportUtils.dateAndAuthorFields('d'),
        ],
        join: exportUtils.dateAndAuthorJoins('d'),
        where: ['d.is_deleted = false'],
      },
      {
        table: 'j_document_massif j',
        foreignField: 'j.id_massif',
        rows,
        localField: 'documents',
        fields: ['j.id_document AS id'],
        join: ['INNER JOIN t_document doc ON doc.id = j.id_document'],
        where: ['doc.is_deleted = false', 'doc.is_validated = true'],
        transform: (e) => e.id,
      },
    ],
  },
  query,
  processRows,
  search: {
    importFormater,
    schema: {
      name: 'massifs',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'dateInscription', type: 'int64' },
        { name: 'dateReviewed', type: 'int64', optional: true },
        { name: 'authorId', type: 'int32' },
        { name: 'author', type: 'string' },
        { name: 'reviewer', type: 'string', optional: true },
        { name: 'name', type: 'string', optional: true, sort: true },
        {
          name: 'language',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        { name: 'nbEntrances', type: 'int32', optional: true },
      ],
      default_sorting_field: 'dateInscription',
    },
    query: {
      collection: 'massifs',
      query_by: 'name',
    },
  },
};
