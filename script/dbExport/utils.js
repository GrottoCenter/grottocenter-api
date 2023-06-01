const CommonService = require('../../api/services/CommonService');

// For a group of rows make a query to a foreign table
// And merge the result back into each row
async function joinMany({
  table,
  foreignField,
  rows,
  localField,
  fields,
  transform,
  where = ['is_deleted = false'],
  join = [],
} = {}) {
  const ids = rows.map((e) => e.id);
  where.unshift(`${foreignField} = ANY($1::int[])`);
  const query = `SELECT ${fields.join(
    ','
  )}, ${foreignField} FROM ${table} ${join.join(' ')} WHERE ${where.join(
    ' AND '
  )}`;

  const { rows: foreignRows } = await CommonService.query(query, [ids]);
  for (const frow of foreignRows) {
    const row = rows.find((e) => e.id === frow[foreignField]);
    if (!row) continue; // eslint-disable-line no-continue
    if (!row[localField]) row[localField] = [];

    if (transform) {
      row[localField].push(transform(frow));
    } else {
      delete frow[foreignField];
      row[localField].push(frow);
    }
  }
}

function dateAndAuthorFields(tableAlias) {
  return [
    `COALESCE(${tableAlias}.date_reviewed, ${tableAlias}.date_inscription) AS last_modified`,
    `COALESCE(${tableAlias}.id_reviewer, ${tableAlias}.id_author) AS last_author_id`,
    `COALESCE(r.nickname, a.nickname) AS last_author`,
  ];
}

function dateAndAuthorJoins(tableAlias) {
  return [
    `LEFT JOIN t_caver a ON a.id = ${tableAlias}.id_author`,
    `LEFT JOIN t_caver r ON r.id = ${tableAlias}.id_reviewer`,
  ];
}

module.exports = {
  EXPORT_FILE_NAME: 'grottocenterDbExport.zip',
  PAGGING_SIZE: 1000,
  PAGGING_PLACEHOLDER: '#PAGGING#',
  joinMany,
  dateAndAuthorFields,
  dateAndAuthorJoins,
};
