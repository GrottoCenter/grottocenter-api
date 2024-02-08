const exportUtils = require('./utils');

const query = `
    SELECT
      m.id,
      m.date_inscription AS created_at,
      m.date_reviewed AS last_modified,
      m.id_author AS author_id,
      a.nickname AS author,
      m.id_reviewer AS last_author_id,
      r.nickname AS last_author,
      n.name AS name,
      ST_AsGeoJSON(m.geog_polygon) AS geojson
    FROM t_massif AS m
    LEFT JOIN t_name n ON n.id_massif = m.id AND n.is_main = true
    LEFT JOIN t_caver a ON a.id = m.id_author
    LEFT JOIN t_caver r ON r.id = m.id_reviewer
    WHERE m.is_deleted = false
    GROUP BY m.id, n.name, r.nickname, a.nickname
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

module.exports = {
  fileName: 'massifs.json',
  query,
  processRows,
};
