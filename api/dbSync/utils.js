const CommonService = require('../services/CommonService');

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
  rowsKey = 'id',
} = {}) {
  const ids = rows.map((e) => e[rowsKey]);
  where.unshift(`${foreignField} = ANY($1::int[])`);
  const query = `SELECT ${fields.join(
    ','
  )}, ${foreignField} FROM ${table} ${join.join(' ')} WHERE ${where.join(
    ' AND '
  )}`;
  const { rows: foreignRows } = await CommonService.query(query, [ids]);
  // Remove the table alias if present. So we can match it with our rows
  const cleanForeignField = foreignField.split('.').pop();
  // Remember:
  // - A single row can attach multiple different foreign rows (ie: the entrance can have multiple locations)
  // - The same foreign row can be attached to multiple different rows (ie: the same cave can be attached to multiple entrances)
  for (const row of rows) {
    const fRows = foreignRows.filter(
      (e) => e[cleanForeignField] === row[rowsKey]
    );
    if (fRows.length === 0) continue; // eslint-disable-line no-continue
    if (!row[localField]) row[localField] = [];
    for (const fRow of fRows) {
      if (transform) {
        row[localField].push(transform(fRow));
      } else {
        const { [cleanForeignField]: _, ...cleanFRow } = fRow;
        row[localField].push(cleanFRow);
      }
    }
  }
}

function dateAndAuthorFields(tableAlias) {
  return [
    `${tableAlias}.date_inscription AS "dateInscription"`,
    `${tableAlias}.date_reviewed AS "dateReviewed"`,
    `${tableAlias}.id_author AS "authorId"`,
    `a.nickname AS author`,
    `${tableAlias}.id_reviewer "reviewerId"`,
    `r.nickname AS reviewer`,
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
