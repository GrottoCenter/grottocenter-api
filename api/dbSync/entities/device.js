const exportUtils = require('../utils');

const query = `
    SELECT
      d.id,
      d.name,
      d.brand_name AS "brandName",
      d.is_deleted AS "isDeleted",
      d.id_author AS "authorId",
      c.nickname AS "authorNickname"
    FROM t_device AS d
    LEFT JOIN t_caver AS c ON c.id = d.id_author
    WHERE d.is_deleted = false
    ORDER BY d.id ASC
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
  d.authorId = `${d.authorId}`;
  return d;
}
/* eslint-enable no-param-reassign */

module.exports = {
  name: 'devices',
  shouldExportToFile: true,
  query,
  processRows,
  search: {
    importFormater,
    schema: {
      name: 'devices',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string', sort: true },
        { name: 'brandName', type: 'string', optional: true, sort: true },
        { name: 'isDeleted', type: 'bool' },
        { name: 'authorId', type: 'string' },
        { name: 'authorNickname', type: 'string', optional: true },
      ],
      default_sorting_field: 'name',
    },
    query: {
      collection: 'devices',
      query_by: 'name,brandName',
    },
  },
};
