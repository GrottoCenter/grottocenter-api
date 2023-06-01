const exportUtils = require('./utils');

const query = `
    SELECT
      c.id,
      COALESCE(c.date_reviewed, c.date_inscription) AS last_modified,
      COALESCE(c.id_reviewer, c.id_author) AS last_author_id,
      COALESCE(r.nickname, a.nickname) AS last_author,
      n.name AS name,
      c.depth,
      c.length,
      c.temperature,
      c.is_diving
    FROM t_cave AS c
    LEFT JOIN t_name n ON n.id_cave = c.id AND n.is_main = true
    LEFT JOIN t_caver a ON a.id = c.id_author
    LEFT JOIN t_caver r ON r.id = c.id_reviewer
    WHERE c.is_deleted = false
    GROUP BY c.id, n.name, r.nickname, a.nickname
    ${exportUtils.PAGGING_PLACEHOLDER}
  `;

async function* processRows(source) {
  for await (const rows of source) {
    const joins = [
      {
        table: 't_description d',
        foreignField: 'id_cave',
        rows,
        localField: 'descriptions',
        fields: ['title', 'body', exportUtils.dateAndAuthorFields('d')],
        join: exportUtils.dateAndAuthorJoins('d'),
      },
      {
        table: 't_entrance',
        foreignField: 'id_cave',
        rows,
        localField: 'entrances',
        fields: ['id'],
        transform: (e) => e.id,
      },
      {
        table: 't_document',
        foreignField: 'id_cave',
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
  fileName: 'caves.json',
  query,
  processRows,
};
