const exportUtils = require('../utils');
const {
  computeDocumentAuthorsSort,
} = require('../../utils/computeDocumentAuthorsSort');

const query = `
    SELECT
      d.id,
      d.id_db_import AS "importId",
      d.name_db_import AS "importSource",
      d.identifier,
      d.id_identifier_type AS "identifierType",
      d.date_inscription AS "dateInscription",
      d.date_reviewed AS "dateReviewed",
      d.date_validation AS "dateValidation",
      d.date_publication AS "datePublication",
      d.id_author AS "creatorId",
      a.nickname AS creator,
      d.id_reviewer AS "reviewerId",
      r.nickname AS reviewer,
      d.id_validator AS "validatorId",
      v.nickname AS validator,
      d.author_comment AS "creatorComment",
      d.id_editor AS "editorId",
      d.id_library AS "libraryId",
      t.name AS type,
      n.title,
      n.body AS description,
      d.issue,
      d.pages,
      l.name AS license,
      d.id_option AS "optionId",
      d.id_cave AS "caveId",
      d.id_parent AS "parentId",
      d.id_authorization_document AS authorizationDocumentId
    FROM t_document AS d
    LEFT JOIN t_description n ON n.id_document = d.id
    LEFT JOIN t_type t ON t.id = d.id_type
    LEFT JOIN t_license l ON l.id = d.id_license
    LEFT JOIN t_caver a ON a.id = d.id_author
    LEFT JOIN t_caver r ON r.id = d.id_reviewer
    LEFT JOIN t_caver v ON v.id = d.id_validator
    WHERE d.is_deleted = false AND d.is_validated = true
    GROUP BY d.id, t.name, n.title, n.body, r.nickname, a.nickname, v.nickname, l.name
    ORDER BY d.id ASC
    ${exportUtils.PAGGING_PLACEHOLDER}
  `;

async function* processRows(source) {
  for await (const rows of source) {
    const joins = [
      {
        table: 't_document p',
        foreignField: 'p.id',
        rows,
        rowsKey: 'parentId',
        localField: 'parent',
        fields: [
          'p.date_inscription AS "dateInscription"',
          'p.date_publication AS "datePublication"',
          't.name AS type',
          'n.title',
          'n.body AS description',
        ],
        join: [
          `LEFT JOIN t_type t ON t.id = p.id_type`,
          `LEFT JOIN t_description n ON n.id_document = p.id`,
        ],
        where: ['p.is_deleted = false', 'p.is_validated = true'],
      },
      {
        table: 't_grotto e',
        foreignField: 'e.id',
        rows,
        rowsKey: 'editorId',
        localField: 'editor',
        fields: ['n.name', 'n.id_language AS language'],
        join: [`LEFT JOIN t_name n ON n.id_grotto = e.id AND n.is_main = true`],
        where: [],
      },
      {
        table: 't_grotto l',
        foreignField: 'l.id',
        rows,
        rowsKey: 'libraryId',
        localField: 'library',
        fields: ['n.name', 'n.id_language AS language'],
        join: [`LEFT JOIN t_name n ON n.id_grotto = l.id AND n.is_main = true`],
        where: [],
      },
      {
        table: 'j_document_iso3166_2',
        foreignField: 'id_document',
        rows,
        localField: 'isoRegions',
        fields: ['r.iso', 'r.name'],
        where: [],
        join: [`LEFT JOIN t_iso3166_2 r ON id_iso = r.iso`],
      },
      {
        table: 'j_document_country',
        foreignField: 'id_document',
        rows,
        localField: 'countries',
        fields: ['c.iso', 'c.native_name AS "name"'],
        where: [],
        join: [`LEFT JOIN t_country c ON id_country = c.iso`],
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
      },
      {
        table: 'j_document_grotto_author j',
        foreignField: 'j.id_document',
        rows,
        localField: 'authorsOrganization',
        fields: ['n.name'],
        where: [],
        join: [
          'LEFT JOIN t_grotto g ON g.id = j.id_grotto',
          'LEFT JOIN t_name n ON n.id_grotto = g.id AND n.is_main = true',
        ],
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
        table: 'j_document_entrance j',
        foreignField: 'j.id_document',
        rows,
        localField: 'entrances',
        fields: ['j.id_entrance AS id', 'n.name', 'n.id_language AS language'],
        join: [
          'LEFT JOIN t_entrance e ON e.id = j.id_entrance',
          'LEFT JOIN t_name n ON n.id_entrance = e.id AND n.is_main = true',
        ],
        where: [],
      },
      {
        table: 't_cave c',
        foreignField: 'c.id',
        rows,
        rowsKey: 'caveId',
        localField: 'cave',
        fields: ['n.name', 'n.id_language AS language'],
        join: [`LEFT JOIN t_name n ON n.id_cave = c.id AND n.is_main = true`],
        where: [],
      },
      {
        table: 'j_document_massif j',
        foreignField: 'j.id_document',
        rows,
        localField: 'massifs',
        fields: ['j.id_massif AS id', 'n.name', 'n.id_language AS language'],
        join: [
          'LEFT JOIN t_massif m ON m.id = id_massif',
          'LEFT JOIN t_name n ON n.id_massif = m.id AND n.is_main = true',
        ],
        where: [],
      },
    ];

    await Promise.all(joins.map((e) => exportUtils.joinMany(e)));
    for (const row of rows) {
      if (row.identifierType) row.identifierType = row.identifierType.trim();
      if (row.importSource) row.importSource = row.importSource.trim();

      row.parent = row.parent?.[0] ?? null;
      row.editor = row.editor?.[0] ?? null;
      row.library = row.library?.[0] ?? null;
      row.iso3166 = [
        ...(row.countries?.map((e) => ({ iso: e.iso, name: e.name })) ?? []),
        ...(row.isoRegions?.map((e) => ({ iso: e.iso, name: e.name })) ?? []),
      ];
      row.cave = row.cave?.[0] ?? null;

      row.authorsSort = computeDocumentAuthorsSort(
        row.authors?.map((e) => e.nickname),
        row.authorsOrganization?.map((e) => e.name)
      );

      yield row;
    }
  }
}

/* eslint-disable no-param-reassign */
function importFormater(d) {
  d.id = `${d.id}`;
  d.dateInscription = new Date(d.dateInscription).getTime();
  if (d.dateReviewed) d.dateReviewed = new Date(d.dateReviewed).getTime();
  if (d.dateValidation) d.dateValidation = new Date(d.dateValidation).getTime();
  d.language = d.languages?.[0];
  return d;
}
/* eslint-enable no-param-reassign */

module.exports = {
  name: 'documents',
  shouldExportToFile: true,
  query,
  processRows,
  search: {
    importFormater,
    schema: {
      name: 'documents',
      enable_nested_fields: true,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'importId', type: 'int32', optional: true, sort: true },
        {
          name: 'importSource',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        { name: 'identifier', type: 'string', optional: true, sort: true },
        {
          name: 'identifierType',
          facet: true,
          type: 'string',
          optional: true,
          sort: true,
        },
        { name: 'dateInscription', type: 'int64' },
        { name: 'dateReviewed', type: 'int64', optional: true },
        { name: 'dateValidation', type: 'int64', optional: true },
        {
          name: 'datePublication',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        { name: 'creatorId', type: 'int32' },
        { name: 'creator', type: 'string' },
        { name: 'reviewer', type: 'string', optional: true },
        { name: 'validator', type: 'string', optional: true },
        { name: 'creatorComment', type: 'string', optional: true },
        { name: 'type', type: 'string', facet: true, sort: true },
        { name: 'title', type: 'string', optional: true, sort: true },
        { name: 'description', type: 'string', optional: true },
        {
          name: 'issue',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        { name: 'pages', type: 'string', optional: true, sort: true },
        {
          name: 'license',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        { name: 'parent.title', type: 'string', optional: true, sort: true },
        {
          name: 'editor.name',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        {
          name: 'library.name',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
        { name: 'iso3166.iso', type: 'string[]', facet: true, optional: true },
        { name: 'subjects.code', type: 'string[]', optional: true },
        {
          name: 'authors.nickname',
          type: 'string[]',
          facet: true,
          optional: true,
        },
        {
          name: 'authorsOrganization.name',
          type: 'string[]',
          facet: true,
          optional: true,
        },
        // Denormalized scalar key for sorting biblio results by author.
        // Typesense cannot sort on the `authors.nickname` array field, so this
        // holds the alphabetical-first author name (persons + organizations).
        // See api/utils/computeDocumentAuthorsSort.js for method & limitations.
        { name: 'authorsSort', type: 'string', optional: true, sort: true },
        { name: 'cave.name', type: 'string', optional: true, sort: true },
        { name: 'entrances.name', type: 'string[]', optional: true },
        { name: 'massifs.name', type: 'string[]', optional: true },
        {
          name: 'language',
          type: 'string',
          facet: true,
          optional: true,
          sort: true,
        },
      ],
      default_sorting_field: 'dateInscription',
    },
    query: {
      collection: 'documents',
      // TODO Add more field ?
      query_by: 'title,description',
    },
  },
};
