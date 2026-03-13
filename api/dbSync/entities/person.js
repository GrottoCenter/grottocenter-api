const exportUtils = require('../utils');

const query = `
    SELECT
      c.id,
      c.mail,
      c.date_inscription AS "dateInscription",
      c.name,
      c.surname,
      c.nickname
      FROM t_caver AS c
    ORDER BY c.id ASC
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
  d.type = !d.mail.toLowerCase().endsWith('@mail.no') ? 'CAVER' : 'AUTHOR';
  delete d.mail;
  return d;
}
/* eslint-enable no-param-reassign */

module.exports = {
  name: 'persons',
  shouldExportToFile: false,
  query,
  processRows,
  search: {
    importFormater,
    schema: {
      name: 'persons',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'dateInscription', type: 'int64' },
        { name: 'type', type: 'string', facet: true, sort: true },
        { name: 'name', type: 'string', optional: true, sort: true },
        { name: 'surname', type: 'string', optional: true, sort: true },
        { name: 'nickname', type: 'string', sort: true },
      ],
      default_sorting_field: 'dateInscription',
    },
    query: {
      collection: 'persons',
      query_by: 'nickname,name,surname',
    },
  },
};
