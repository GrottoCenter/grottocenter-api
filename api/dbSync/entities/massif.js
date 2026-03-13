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
      COUNT(e.id) AS "nbEntrances",
      ST_AsGeoJSON(m.geog_polygon) AS geojson
    FROM t_massif AS m
    LEFT JOIN t_name n ON n.id_massif = m.id AND n.is_main = true
    LEFT JOIN t_caver a ON a.id = m.id_author
    LEFT JOIN t_caver r ON r.id = m.id_reviewer
    LEFT JOIN t_entrance e ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom) AND e.is_deleted = false
    WHERE m.is_deleted = false
    GROUP BY m.id, m.geog_polygon, n.name, n.id_language, r.nickname, a.nickname
    ORDER BY m.id ASC
    ${exportUtils.PAGGING_PLACEHOLDER}
  `;

async function* processRows(source) {
  for await (const rows of source) {
    const joins = [
      {
        table: 't_description d',
        foreignField: 'id_massif',
        rows,
        localField: 'descriptions',
        fields: ['title', 'body', exportUtils.dateAndAuthorFields('d')],
        join: exportUtils.dateAndAuthorJoins('d'),
      },
      {
        table: 't_document',
        foreignField: 'id_massif',
        rows,
        localField: 'documents',
        fields: ['id'],
        transform: (e) => e.id,
      },
    ];

    await Promise.all(joins.map((e) => exportUtils.joinMany(e)));
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
  shouldExportToFile: true,
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
