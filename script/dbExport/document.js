const exportUtils = require('./utils');

const query = `
    SELECT
      d.id,
      COALESCE(d.date_reviewed, d.date_inscription) AS last_modified,
      COALESCE(d.id_reviewer, d.id_author) AS last_author_id,
      COALESCE(r.nickname, a.nickname) AS last_author,
      t.name AS type,
      n.title,
      n.body AS summary,
      d.pages,
      d.identifier,
      d.date_publication,
      d.issue,
      d.ref_bbs,
      d.id_parent,
      d.author_comment,
      d.id_editor AS id_organization_editor,
      d.id_library AS id_organization_library
    FROM t_document AS d
    LEFT JOIN t_description n ON n.id_document = d.id
    LEFT JOIN t_type t ON t.id = d.id_type
    LEFT JOIN t_caver a ON a.id = d.id_author
    LEFT JOIN t_caver r ON r.id = d.id_reviewer
    WHERE d.is_deleted = false AND d.is_validated = true
    GROUP BY d.id, t.name, n.title, n.body, r.nickname, a.nickname
    ${exportUtils.PAGGING_PLACEHOLDER}
  `;

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
        table: 'j_document_region',
        foreignField: 'id_document',
        rows,
        localField: 'regions',
        fields: ['r.id_country', 'r.name'],
        where: [],
        join: ['LEFT JOIN t_region r ON r.id = id_region'],
        transform: (e) => ({ country: e.id_country, name: e.name }),
      },
      {
        table: 'j_document_subject',
        foreignField: 'id_document',
        rows,
        localField: 'regions',
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
    ];

    await Promise.all(joins.map((e) => exportUtils.joinMany(e)));
    for (const row of rows) yield row;
  }
}

module.exports = {
  fileName: 'documents.json',
  query,
  processRows,
};
