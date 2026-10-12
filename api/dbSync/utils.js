const CommonService = require('../services/CommonService');

const PAGGING_SIZE = 1000;
const PAGGING_PLACEHOLDER = '#PAGGING#';
const ID_FILTER_PLACEHOLDER = '#ID_FILTER#';

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

// Join the cave's main name as `${nameAlias}` (name, id_language). A cave with
// no name row of its own was created through one of its entrances and goes by
// that entrance's main name, as NameService.setNames resolves it. Live rows rank
// first: a soft-deleted entrance names the cave only when nothing else is left.
function caveNameJoin(caveAlias, nameAlias = 'n') {
  return `LEFT JOIN LATERAL (
    SELECT candidates.name, candidates.id_language FROM (
      SELECT cn.name, cn.id_language, 0 AS rank, cn.is_deleted AS deleted,
        0 AS entrance_id, cn.id AS name_id
      FROM t_name cn
      WHERE cn.id_cave = ${caveAlias}.id AND cn.is_main = true
      UNION ALL
      SELECT en.name, en.id_language, 1, (ce.is_deleted OR en.is_deleted), ce.id, en.id
      FROM t_entrance ce
      JOIN t_name en ON en.id_entrance = ce.id AND en.is_main = true
      WHERE ce.id_cave = ${caveAlias}.id
      AND NOT EXISTS (SELECT 1 FROM t_name x WHERE x.id_cave = ${caveAlias}.id)
    ) candidates
    ORDER BY candidates.rank, candidates.deleted, candidates.entrance_id, candidates.name_id
    LIMIT 1
  ) ${nameAlias} ON true`;
}

// Join, as `${liveAlias}`, the live row `${alias}` stands for: itself, or the
// row it was merged into (redirect_to) once soft-deleted. An inner join, so a
// soft-deleted row that was never merged drops out.
function liveRowJoin(table, alias, liveAlias) {
  return `JOIN ${table} ${liveAlias} ON ${liveAlias}.id =
    CASE WHEN ${alias}.is_deleted THEN ${alias}.redirect_to ELSE ${alias}.id END
    AND ${liveAlias}.is_deleted = false`;
}

// Keep the first item of each key: two links can lead to the same live row
function uniqueBy(items, key) {
  if (!items) return items;
  const seen = new Set();
  return items.filter((e) => !seen.has(e[key]) && seen.add(e[key]));
}

// Keyset pagination: each page starts after the last id of the previous one,
// so the cost of a page does not grow with its position like OFFSET does.
// Every entity query orders by its id and holds both placeholders.
async function* paggingQuery(name, query, ref = {}, pageSize = PAGGING_SIZE) {
  const queryRaw = query
    .replace(ID_FILTER_PLACEHOLDER, '> $1')
    .replace(PAGGING_PLACEHOLDER, `LIMIT ${pageSize}`);
  let lastId = 0;
  let fetched = 0;
  let nbRows = 0;
  do {
    // eslint-disable-next-line no-await-in-loop
    const rep = await CommonService.query(queryRaw, [lastId]).catch((e) => {
      sails.log.error(`[dbSync] Error paggingQuery ${name}`, query, e);
      throw e;
    });
    nbRows = rep.rowCount;
    fetched += nbRows;
    ref.fetched = fetched; // eslint-disable-line no-param-reassign
    if (nbRows > 0) lastId = rep.rows[nbRows - 1].id;
    yield rep.rows;
  } while (nbRows === pageSize);

  if (fetched === 0) {
    sails.log.warn(`[dbSync] WARNING: ${name} returned 0 rows`);
  }
}

// Same pages as paggingQuery, restricted to the given ids: every entity query
// then serves both the full rebuild and the update of a few documents.
async function* idsQuery(name, query, ids, pageSize = PAGGING_SIZE) {
  const queryRaw = query
    .replace(ID_FILTER_PLACEHOLDER, '= ANY($1::int[])')
    .replace(PAGGING_PLACEHOLDER, '');
  for (let i = 0; i < ids.length; i += pageSize) {
    // eslint-disable-next-line no-await-in-loop
    const rep = await CommonService.query(queryRaw, [
      ids.slice(i, i + pageSize),
    ]).catch((e) => {
      sails.log.error(`[dbSync] Error idsQuery ${name}`, query, e);
      throw e;
    });
    if (rep.rowCount > 0) yield rep.rows;
  }
}

async function* JSONArrayStringify(aStream) {
  let isFirst = true;
  yield '[\n';
  for await (const obj of aStream) {
    if (isFirst) {
      isFirst = false;
      yield `${JSON.stringify(obj)}`;
    } else {
      yield `,\n${JSON.stringify(obj)}`;
    }
  }
  yield '\n]';
}

module.exports = {
  EXPORT_FILE_NAME: 'grottocenterDbExport.zip',
  PAGGING_SIZE,
  PAGGING_PLACEHOLDER,
  ID_FILTER_PLACEHOLDER,
  paggingQuery,
  idsQuery,
  JSONArrayStringify,
  joinMany,
  dateAndAuthorFields,
  dateAndAuthorJoins,
  caveNameJoin,
  liveRowJoin,
  uniqueBy,
};
