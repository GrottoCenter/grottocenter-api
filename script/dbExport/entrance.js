const exportUtils = require('./utils');

const query = `
    SELECT
      e.id,
      e.date_inscription AS created_at,
      e.date_reviewed AS last_modified,
      e.id_author AS author_id,
      a.nickname AS author,
      e.id_reviewer AS last_author_id,
      r.nickname AS last_author,
      n.name AS name,
      e.iso_3166_2 AS iso3166,
      e.id_country AS country,
      e.region,
      e.county,
      e.city,
      e.latitude,
      e.longitude,
      e.altitude,
      e.is_sensitive,
      e.year_discovery,
      e.id_geology AS geology,
      e.id_cave AS cave
    FROM t_entrance AS e
    LEFT JOIN t_name n ON n.id_entrance = e.id AND n.is_main = true
    LEFT JOIN t_caver a ON a.id = e.id_author
    LEFT JOIN t_caver r ON r.id = e.id_reviewer
    WHERE e.is_deleted = false
    GROUP BY e.id, n.name, r.nickname, a.nickname
    ${exportUtils.PAGGING_PLACEHOLDER}
  `;

async function* processRows(source) {
  for await (const rows of source) {
    const joins = [
      {
        table: 't_location l',
        foreignField: 'id_entrance',
        rows,
        localField: 'locations',
        fields: ['title', 'body', exportUtils.dateAndAuthorFields('l')],
        join: exportUtils.dateAndAuthorJoins('l'),
      },
      {
        table: 't_description d',
        foreignField: 'id_entrance',
        rows,
        localField: 'descriptions',
        fields: ['title', 'body', exportUtils.dateAndAuthorFields('d')],
        join: exportUtils.dateAndAuthorJoins('d'),
      },
      {
        table: 't_rigging rg',
        foreignField: 'id_entrance',
        rows,
        localField: 'riggings',
        fields: [
          'title',
          'obstacles',
          'ropes',
          'anchors',
          'observations',
          exportUtils.dateAndAuthorFields('rg'),
        ],
        join: exportUtils.dateAndAuthorJoins('rg'),
      },
      {
        table: 't_history h',
        foreignField: 'id_entrance',
        rows,
        localField: 'histories',
        fields: ['body', exportUtils.dateAndAuthorFields('h')],
        join: exportUtils.dateAndAuthorJoins('h'),
      },
      {
        table: 't_document',
        foreignField: 'id_entrance',
        rows,
        localField: 'documents',
        fields: ['id'],
        transform: (e) => e.id,
      },
      {
        table: 't_comment c',
        foreignField: 'id_entrance',
        rows,
        localField: 'comments',
        fields: [
          'title',
          'body',
          'aestheticism',
          'caving',
          'approach',
          'e_t_trail',
          'e_t_underground',
          exportUtils.dateAndAuthorFields('c'),
        ],
        join: exportUtils.dateAndAuthorJoins('c'),
      },
    ];

    await Promise.all(joins.map((e) => exportUtils.joinMany(e)));

    for (const row of rows) {
      if (row.is_sensitive) {
        row.latitude = null;
        row.longitude = null;
        row.locations = [];
      }
      yield row;
    }
  }
}

module.exports = {
  fileName: 'entrances.json',
  query,
  processRows,
};
