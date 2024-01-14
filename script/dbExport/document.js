const exportUtils = require('./utils');

const query = `
    SELECT
      d.id,
      d.id_db_import AS import_id,
      d.name_db_import AS import_source,
      d.identifier,
      d.id_identifier_type AS identifier_type,
      d.date_inscription AS created_at,
      d.date_reviewed AS last_modified,
      d.id_author AS author_id,
      a.nickname AS author,
      d.id_reviewer AS last_author_id,
      d.author_comment,
      r.nickname AS last_author,
      d.date_publication,
      d.id_editor AS id_organization_editor,
      d.id_library AS id_organization_library,
      t.name AS type,
      n.title,
      n.body AS description,
      d.issue,
      d.pages,
      l.name AS license,
      d.id_entrance,
      d.id_cave,
      d.id_parent,
      d.id_authorization_document
    FROM t_document AS d
    LEFT JOIN t_description n ON n.id_document = d.id
    LEFT JOIN t_type t ON t.id = d.id_type
    LEFT JOIN t_license l ON l.id = d.id_license
    LEFT JOIN t_caver a ON a.id = d.id_author
    LEFT JOIN t_caver r ON r.id = d.id_reviewer
    WHERE d.is_deleted = false AND d.is_validated = true
    GROUP BY d.id, t.name, n.title, n.body, r.nickname, a.nickname, l.name
    ${exportUtils.PAGGING_PLACEHOLDER}
  `;

// TODO Add old bbs fields ?
// - pages_bbs_old
// - comments_bbs_old
// - publication_other_bbs_old
// - publication_fascicule_bbs_old

const baseUrl = 'https://grottocenter.blob.core.windows.net/documents/';

async function* processRows(source) {
  for await (const rows of source) {
    const joins = [
      {
        table: 't_file',
        foreignField: 'id_document',
        rows,
        localField: 'files',
        fields: ['filename', 'path'],
        where: ['is_validated = true'],
        transform: (e) => ({ filename: e.filename, url: baseUrl + e.path }),
      },
      {
        table: 'j_document_iso3166_2',
        foreignField: 'id_document',
        rows,
        localField: 'iso_regions',
        fields: ['id_iso'],
        where: [],
        transform: (e) => e.id_iso,
      },
      {
        table: 'j_document_country',
        foreignField: 'id_document',
        rows,
        localField: 'countries',
        fields: ['id_country'],
        where: [],
        transform: (e) => e.id_country,
      },
      {
        table: 'j_document_subject',
        foreignField: 'id_document',
        rows,
        localField: 'subjects',
        fields: ['s.code', 's.subject'],
        where: [],
        join: ['LEFT JOIN t_subject s ON s.code = code_subject'],
      },
      {
        table: 'j_document_caver_author',
        foreignField: 'id_document',
        rows,
        localField: 'authors',
        fields: ['c.nickname'],
        where: [],
        join: ['LEFT JOIN t_caver c ON c.id = id_caver'],
        transform: (e) => e.nickname,
      },
      {
        table: 'j_document_language',
        foreignField: 'id_document',
        rows,
        localField: 'languages',
        fields: ['id_language'],
        where: [],
        transform: (e) => e.id_language,
      },
      {
        table: 'j_document_massif',
        foreignField: 'id_document',
        rows,
        localField: 'massifs',
        fields: ['id_massif'],
        where: [],
        transform: (e) => e.id_massif,
      },
    ];

    await Promise.all(joins.map((e) => exportUtils.joinMany(e)));
    for (const row of rows) {
      if (row.identifier_type) row.identifier_type = row.identifier_type.trim();

      yield row;
    }
  }
}

module.exports = {
  fileName: 'documents.json',
  query,
  processRows,
};
