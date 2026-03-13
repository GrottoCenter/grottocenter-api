const exportUtils = require('../utils');

const query = `
    SELECT
      g.id,
      g.date_inscription AS "dateInscription",
      g.date_reviewed AS "dateReviewed",
      g.id_author AS "authorId",
      a.nickname AS author,
      g.id_reviewer AS "reviewerId",
      r.nickname AS reviewer,
      n.name AS name,
      n.id_language AS language,
      g.custom_message AS "customMessage",
      g.url,
      g.is_official_partner AS "isOfficialPartner",
      g.year_birth AS "yearBirth",
      g.mail,
      g.iso_3166_2 AS iso3166,
      g.latitude,
      g.longitude,
      g.address,
      g.city,
      g.county,
      g.region,
      CONCAT (g.id_country, ' - ', c.native_name) AS country,
      g.postal_code AS "postalCode",
      COUNT(m.id_caver) AS "nbCavers"
    FROM t_grotto AS g
    LEFT JOIN t_name n ON n.id_grotto = g.id AND n.is_main = true
    LEFT JOIN t_country c ON c.iso = g.id_country
    LEFT JOIN t_caver a ON a.id = g.id_author
    LEFT JOIN t_caver r ON r.id = g.id_reviewer
    LEFT JOIN j_grotto_caver m ON m.id_grotto = g.id
    WHERE g.is_deleted = false
    GROUP BY g.id, n.name, n.id_language, c.iso3, c.native_name, c.en_name, c.es_name, c.fr_name, c.de_name, c.bg_name, c.it_name, c.ca_name, c.nl_name, c.rs_name, r.nickname, a.nickname
    ORDER BY g.id ASC
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
  if (d.latitude) d.latitude = parseFloat(d.latitude);
  if (d.longitude) d.longitude = parseFloat(d.longitude);
  if (d.nbCavers) d.nbCavers = parseInt(d.nbCavers, 10);
  return d;
}
/* eslint-enable no-param-reassign */

module.exports = {
  name: 'organizations',
  shouldExportToFile: true,
  query,
  processRows,
  search: {
    importFormater,
    schema: {
      name: 'organizations',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'dateInscription', type: 'int64' },
        { name: 'dateReviewed', type: 'int64', optional: true },
        { name: 'authorId', type: 'int32' },
        { name: 'author', type: 'string' },
        { name: 'reviewer', type: 'string', optional: true },
        { name: 'name', type: 'string', sort: true },
        { name: 'language', type: 'string', facet: true, sort: true },
        { name: 'isOfficialPartner', type: 'bool' },
        { name: 'yearBirth', type: 'int32', optional: true },
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
          name: 'postalCode',
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
        { name: 'address', type: 'string', optional: true },
        {
          name: 'mail',
          type: 'string',
          token_separators: ['+', '-', '@', '.'],
          optional: true,
        },
        {
          name: 'url',
          type: 'string',
          token_separators: [':', '/', '.'],
          optional: true,
        },
        {
          name: 'customMessage',
          type: 'string',
          token_separators: [':', '/', '.'],
          optional: true,
        },
        { name: 'nbCavers', type: 'int32', optional: true },
      ],
      default_sorting_field: 'dateInscription',
    },
    query: {
      collection: 'organizations',
      query_by:
        'name,address,city,postalCode,county,region,country,language,mail,url,customMessage',
    },
  },
};
