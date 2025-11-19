const exportUtils = require('../utils');

const query = `
    SELECT
      c.id,
      c.date_inscription AS "dateInscription",
      c.date_reviewed AS "dateReviewed",
      c.id_author AS "authorId",
      a.nickname AS author,
      c.id_reviewer AS "reviewerId",
      r.nickname AS reviewer,
      n.name AS name,
      n.id_language AS language,
      c.depth,
      c.length,
      c.temperature,
      c.is_diving AS "isDiving"
    FROM t_cave AS c
    LEFT JOIN t_name n ON n.id_cave = c.id AND n.is_main = true
    LEFT JOIN t_caver a ON a.id = c.id_author
    LEFT JOIN t_caver r ON r.id = c.id_reviewer
    WHERE c.is_deleted = false
    GROUP BY c.id, n.name, n.id_language, r.nickname, a.nickname
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

/* eslint-disable no-param-reassign */
function importFormater(d) {
  d.id = `${d.id}`;
  d.dateInscription = new Date(d.dateInscription).getTime();
  if (d.dateReviewed) d.dateReviewed = new Date(d.dateReviewed).getTime();
  return d;
}
/* eslint-enable no-param-reassign */

module.exports = {
  name: 'caves',
  shouldExportToFile: true,
  query,
  processRows,
  search: {
    importFormater,
    schema: {
      name: 'caves',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'dateInscription', type: 'int64' },
        { name: 'dateReviewed', type: 'int64', optional: true },
        { name: 'authorId', type: 'int32' },
        { name: 'author', type: 'string' },
        { name: 'reviewer', type: 'string', optional: true },
        { name: 'name', type: 'string', sort: true },
        { name: 'language', type: 'string', facet: true, sort: true },
        { name: 'depth', type: 'int32', optional: true, sort: true },
        { name: 'length', type: 'int32', optional: true, sort: true },
        { name: 'temperature', type: 'float', optional: true, sort: true },
        { name: 'isDiving', type: 'bool', optional: true, sort: true },
      ],
      default_sorting_field: 'dateInscription',
    },
    query: {
      collection: 'caves',
      query_by: 'name',
    },
  },
};
