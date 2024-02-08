const exportUtils = require('./utils');

const query = `
    SELECT
      g.id,
      g.date_inscription AS created_at,
      g.date_reviewed AS last_modified,
      g.id_author AS author_id,
      a.nickname AS author,
      g.id_reviewer AS last_author_id,
      r.nickname AS last_author,
      n.name AS name,
      g.custom_message,
      g.year_birth,
      g.mail,
      g.latitude,
      g.longitude,
      g.address,
      g.city,
      g.region,
      c.native_name AS country,
      g.postal_code
    FROM t_grotto AS g
    LEFT JOIN t_name n ON n.id_grotto = g.id AND n.is_main = true
    LEFT JOIN t_country c ON c.iso = g.id_country
    LEFT JOIN t_caver a ON a.id = g.id_author
    LEFT JOIN t_caver r ON r.id = g.id_reviewer
    WHERE g.is_deleted = false
    GROUP BY g.id, n.name, c.iso3, c.native_name, c.en_name, c.es_name, c.fr_name, c.de_name, c.bg_name, c.it_name, c.ca_name, c.nl_name, c.rs_name, r.nickname, a.nickname
    ${exportUtils.PAGGING_PLACEHOLDER}
  `;

async function* processRows(source) {
  for await (const rows of source) {
    for (const row of rows) yield row;
  }
}

module.exports = {
  fileName: 'organizations.json',
  query,
  processRows,
};
