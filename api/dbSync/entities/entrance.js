const exportUtils = require('../utils');

function average(arr) {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
const filterFn = (e) => e && e > 0;

const query = `
    SELECT
      e.id,
      e.date_inscription AS "dateInscription",
      e.date_reviewed AS "dateReviewed",
      e.id_author AS "authorId",
      a.nickname AS author,
      e.id_reviewer AS "reviewerId",
      r.nickname AS reviewer,
      n.name AS name,
      n.id_language AS language,
      e.iso_3166_2 AS iso3166,
      CONCAT (e.id_country, ' - ', c.native_name) AS country,
      e.region,
      e.county,
      e.city,
      e.latitude,
      e.longitude,
      e.altitude,
      e.precision,
      e.is_sensitive AS "isSensitive",
      e.year_discovery AS "discoveryYear",
      e.id_geology AS geology,
      e.id_cave AS "caveId"
    FROM t_entrance AS e
    LEFT JOIN t_name n ON n.id_entrance = e.id AND n.is_main = true
    LEFT JOIN t_country c ON c.iso = e.id_country
    LEFT JOIN t_caver a ON a.id = e.id_author
    LEFT JOIN t_caver r ON r.id = e.id_reviewer
    WHERE e.is_deleted = false
    GROUP BY e.id, n.name, n.id_language, c.native_name, r.nickname, a.nickname
    ${exportUtils.PAGGING_PLACEHOLDER}
  `;

async function* processRows(source) {
  for await (const rows of source) {
    const joins = [
      {
        table: 't_cave c',
        foreignField: 'c.id',
        rows,
        rowsKey: 'caveId',
        localField: 'cave',
        fields: [
          'n.name',
          'depth',
          'length',
          'temperature',
          'is_diving AS "isDiving"',
        ],
        join: [`LEFT JOIN t_name n ON n.id_cave = c.id AND n.is_main = true`],
        transform: (e) => e, // Allow to also keep the id
        where: [],
      },
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
        table: 'j_document_entrance j',
        foreignField: 'j.id_entrance',
        rows,
        localField: 'documents',
        fields: ['j.id_document AS id'],
        where: [],
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
      if (row.geology) row.geology = row.geology.trim();

      if (row.isSensitive) {
        row.latitude = null;
        row.longitude = null;
        row.locations = [];
      }

      row.cave = row.cave?.[0] ?? null;

      yield row;
    }
  }
}

/* eslint-disable no-param-reassign */
function importFormater(d) {
  d.id = `${d.id}`;
  d.dateInscription = new Date(d.dateInscription).getTime();
  if (d.dateReviewed) d.dateReviewed = new Date(d.dateReviewed).getTime();
  if (d.latitude) d.latitude = parseFloat(d.latitude);
  if (d.longitude) d.longitude = parseFloat(d.longitude);

  const comments = d.comments ?? [];
  d.commentsRating = {
    aestheticism: average(comments.map((c) => c.aestheticism).filter(filterFn)),
    caving: average(comments.map((c) => c.caving).filter(filterFn)),
    approach: average(comments.map((c) => c.approach).filter(filterFn)),
  };

  return d;
}
/* eslint-enable no-param-reassign */

module.exports = {
  name: 'entrances',
  shouldExportToFile: true,
  query,
  processRows,
  search: {
    importFormater,
    schema: {
      name: 'entrances',
      enable_nested_fields: true,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'dateInscription', type: 'int64' },
        { name: 'dateReviewed', type: 'int64', optional: true },
        { name: 'authorId', type: 'int32' },
        { name: 'author', type: 'string' },
        { name: 'reviewer', type: 'string', optional: true },
        { name: 'name', type: 'string', sort: true },
        { name: 'language', type: 'string', facet: true, sort: true },
        { name: 'isSensitive', type: 'bool' },
        { name: 'discoveryYear', type: 'int32', optional: true },
        {
          name: 'geology',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        { name: 'altitude', type: 'float', optional: true, sort: true },
        { name: 'precision', type: 'int32', optional: true, sort: true },
        { name: 'latitude', type: 'float', optional: true },
        { name: 'longitude', type: 'float', optional: true },
        {
          name: 'country',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        {
          name: 'region',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        {
          name: 'county',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        {
          name: 'city',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        {
          name: 'iso3166',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        { name: 'cave.name', type: 'string', optional: true, sort: true },
        { name: 'cave.depth', type: 'int32', optional: true, sort: true },
        { name: 'cave.length', type: 'int32', optional: true, sort: true },
        { name: 'cave.temperature', type: 'float', optional: true, sort: true },
        { name: 'cave.isDiving', type: 'bool', optional: true, sort: true },
        {
          name: 'commentsRating.aestheticism',
          type: 'float',
          optional: true,
          sort: true,
        },
        {
          name: 'commentsRating.caving',
          type: 'float',
          optional: true,
          sort: true,
        },
        {
          name: 'commentsRating.approach',
          type: 'float',
          optional: true,
          sort: true,
        },
      ],
      default_sorting_field: 'dateInscription',
    },
    query: {
      collection: 'entrances',
      query_by: 'name,cave.name',
    },
  },
};
