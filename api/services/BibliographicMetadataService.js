const METADATA_STATUS = {
  REGISTERED: 'registered',
  DELETED: 'deleted',
};

/**
 * Recursively search in tree structure for a specific field
 * the tree structure is expected to be an object with 'and', 'or', or 'not' properties
 * if the field is found, the function returns directly its value
 * @param {Object} node – the current node in the tree structure
 * @param {string} fieldName – ex. 'title'
 * @returns {any|null} – the value of the first field corresponding to fieldName if found, otherwise null
 */
function findFieldInQuery(node, fieldName) {
  if (!node || typeof node !== 'object') return null;
  // simple case : direct field access
  if (node[fieldName] !== undefined) {
    return node[fieldName];
  }
  // and logic
  if (Array.isArray(node.and)) {
    for (const child of node.and) {
      const v = findFieldInQuery(child, fieldName);
      if (v != null) return v;
    }
  }
  // or logic
  if (Array.isArray(node.or)) {
    for (const child of node.or) {
      const v = findFieldInQuery(child, fieldName);
      if (v != null) return v;
    }
  }
  // not logic
  if (node.not) {
    return findFieldInQuery(node.not, fieldName);
  }
  return null;
}

module.exports = {
  /**
   * Get a bibliographic record by its ID
   * @param {string} id - the ID of the record to retrieve
   * @param {boolean} registeredOnly - if true, only return registered records; if false, return all records
   */
  async getMetadata(id, registeredOnly = true) {
    const criteria = {};

    if (registeredOnly) {
      criteria.metadataStatus = METADATA_STATUS.REGISTERED;
    }

    if (Array.isArray(id)) {
      criteria.id = id;
      const records = await sails.models.vbibliographicmetadata.find(criteria);
      return records;
    }

    criteria.id = id;
    const record = await sails.models.vbibliographicmetadata.findOne(criteria);
    return record;
  },

  /**
   * Search bibliographic metadata with complex query structure
   * @param {Object} query - Search query object
   * @returns {Object} Search results with id, title, author, publisher and date
   */
  async searchMetadata(query) {
    const titleFilter = findFieldInQuery(query, 'title');

    let matchingIds = [];

    if (titleFilter) {
      // search by title
      const sqlTitle = `SELECT id_document AS id, children
            FROM v_bibliographic_metadata
            WHERE metadata_status = 'registered'
            AND unaccent(dc_title) ILIKE unaccent('%${titleFilter}%')`;
      const { rows } = await sails.sendNativeQuery(sqlTitle);
      const ids = rows.map((m) => m.id);
      const children = rows.flatMap((m) => m.children || []);
      matchingIds = Array.from(new Set([...ids, ...children]));
    }

    if (matchingIds.length > 0) {
      const { sql, params } = this.buildSearchSQL(query, false, matchingIds);

      const { rows } = await sails.sendNativeQuery(sql, params);
      return rows.map((r) => this.formatSearchResult(r));
    }

    return [];
  },

  /**
   * Build SQL query from Z39.50 query format
   * @param {Object} query - Query object
   * @param {boolean} includeDeleted - Include deleted records
   * @returns {Object} SQL query and parameters
   */
  buildSearchSQL(query, includeDeleted = false, ids = []) {
    const baseWhere = includeDeleted
      ? "metadata_status = 'deleted'"
      : "metadata_status = 'registered'";
    const whereClauses = [baseWhere];
    const params = [];
    let paramIndex = 1;

    if (Array.isArray(ids) && ids.length > 0) {
      whereClauses.push(`id_document = ANY($${paramIndex}::int[])`);
      params.push(ids);
      paramIndex += 1;
    }

    if (query) {
      const { clause } = this.processQueryNode(query, params, paramIndex);
      if (clause) {
        whereClauses.push(clause);
      }
    }

    const sql = `
        SELECT *
        FROM v_bibliographic_metadata
        WHERE ${whereClauses.join(' AND ')}
        LIMIT 1500`;

    return { sql, params };
  },

  /**
   * Process query node recursively to build SQL
   * @param {Object} node - Query node
   * @param {Array} params - Parameters array
   * @param {number} paramIndex - Current parameter index
   * @param {boolean} isNot - Whether this is a NOT condition
   * @returns {Object} SQL clause and parameters
   */
  processQueryNode(node, params = [], paramIndex = 1, isNot = false) {
    const conditions = [];
    let currentParamIndex = paramIndex;

    // process logical operator
    if (node.and && Array.isArray(node.and)) {
      const subClauses = [];
      node.and.forEach((condition) => {
        const { clause, nextParamIndex } = this.processQueryNode(
          condition,
          params,
          currentParamIndex,
          isNot
        );
        if (clause) {
          subClauses.push(clause);
          currentParamIndex = nextParamIndex;
        }
      });
      if (subClauses.length > 0) {
        conditions.push(`(${subClauses.join(' AND ')})`);
      }
    }

    if (node.or && Array.isArray(node.or)) {
      const subClauses = [];
      node.or.forEach((condition) => {
        const { clause, nextParamIndex } = this.processQueryNode(
          condition,
          params,
          currentParamIndex,
          isNot
        );
        if (clause) {
          subClauses.push(clause);
          currentParamIndex = nextParamIndex;
        }
      });
      if (subClauses.length > 0) {
        conditions.push(`(${subClauses.join(' OR ')})`);
      }
    }

    if (node.not) {
      const { clause, nextParamIndex } = this.processQueryNode(
        node.not,
        params,
        currentParamIndex,
        !isNot
      );
      if (clause) {
        conditions.push(clause);
        currentParamIndex = nextParamIndex;
      }
    }

    // process the search field
    const fieldMappings = this.getFieldMappings();
    Object.keys(fieldMappings).forEach((searchField) => {
      if (node[searchField]) {
        const dbField = fieldMappings[searchField];
        const value = node[searchField];

        switch (searchField) {
          case 'id': {
            params.push(`${value}`);
            const titleOperator = isNot ? '!=' : '=';
            conditions.push(
              `${dbField} ${titleOperator} $${currentParamIndex}`
            );
            currentParamIndex += 1;
            break;
          }
          case 'author': {
            params.push(`%${value}%`);
            const authorOperator = isNot ? 'NOT ILIKE' : 'ILIKE';
            conditions.push(
              `${dbField} ${authorOperator} $${currentParamIndex}`
            );
            currentParamIndex += 1;
            break;
          }
          case 'publisher': {
            params.push(`%${value}%`);
            const publisherOperator = isNot ? 'NOT ILIKE' : 'ILIKE';
            conditions.push(
              `${dbField} ${publisherOperator} $${currentParamIndex}`
            );
            currentParamIndex += 1;
            break;
          }
          case 'date': {
            const year = parseInt(value, 10);
            if (!Number.isNaN(year)) {
              const start = `${year}-01-01`;
              const end = `${year}-12-31`;
              params.push(start, end);
              const dateOperator = isNot ? 'NOT BETWEEN' : 'BETWEEN';
              conditions.push(
                `${dbField} ${dateOperator} $${currentParamIndex}::date` +
                  ` AND $${currentParamIndex + 1}::date`
              );
              currentParamIndex += 2;
            }
            break;
          }
          case 'ean':
          case 'isbn':
          case 'issn': {
            params.push(`%${searchField}:${value}%`);
            const identifierOperator = isNot ? 'NOT ILIKE' : 'ILIKE';
            conditions.push(
              `${dbField} ${identifierOperator} $${currentParamIndex}`
            );
            currentParamIndex += 1;
            break;
          }
          case 'bibliographiclevel': {
            let searchTypes = [];
            switch (value) {
              case 's':
                searchTypes = ['grottocenter:collection'];
                break;
              case 'a':
                searchTypes = ['grottocenter:article'];
                break;
              case 'm':
                searchTypes = [
                  'grottocenter:text',
                  'grottocenter:book',
                  'grottocenter:report',
                  'grottocenter:map',
                  'grottocenter:topographic drawing',
                  'grottocenter:topographic data',
                  'grottocenter:moving image',
                  'grottocenter:sound',
                  'grottocenter:image',
                  'grottocenter:interactive resource',
                  'grottocenter:dataset',
                  'grottocenter:physical object',
                  'grottocenter:authorization to publish',
                ];
                break;
              case 'c':
                searchTypes = ['grottocenter:issue'];
                break;
              default:
                searchTypes = ['grottocenter:other'];
                break;
            }
            if (searchTypes.length > 0) {
              params.push(searchTypes);
              const levelOperator = isNot ? 'NOT' : '';
              conditions.push(
                `${levelOperator}${dbField} && $${currentParamIndex}::text[]`
              );
              currentParamIndex += 1;
            }
            break;
          }
          default:
            break;
        }
      }
    });

    return {
      clause: conditions.join(' AND '),
      nextParamIndex: currentParamIndex,
    };
  },

  /**
   * Get field mappings between search fields and database fields
   * @returns {Object} Field mappings
   */
  getFieldMappings() {
    return {
      id: 'id_document',
      title: 'dc_title',
      author: 'dc_creators::text',
      date: 'dc_date',
      publisher: 'dc_publisher',
      ean: 'dc_identifiers::text',
      issn: 'dc_identifiers::text',
      isbn: 'dc_identifiers::text',
      bibliographiclevel: 'list_sets::text[]',
    };
  },

  /**
   * Format search result for API response
   * @param {Object} record - Database record
   * @returns {Object} Formatted result
   */
  formatSearchResult(record) {
    const result = {
      id: record.id_document,
      title: record.dc_title || null,
      publisher: record.dc_publisher || null,
      authors:
        record.dc_creators && record.dc_creators.length > 0
          ? record.dc_creators
          : null,
      publicationYear: record.dc_date
        ? new Date(record.dc_date).getFullYear()
        : null,
    };

    return result;
  },

  /**
   * Get the title and ID of the parent document
   * @param {string} documentId - The ID of the document to find parents for
   * @returns {Promise<Array>} An array of objects containing the ID and title of each parent document
   */
  getTitleAndIdParents: async (documentId) => {
    const sql = `
      SELECT
        id_document AS id,
        dc_title AS dcTitle
      FROM v_bibliographic_metadata
      WHERE $1 = ANY(children)
        AND metadata_status = 'registered'
    `;
    const { rows: parents } = await sails.sendNativeQuery(sql, [documentId]);

    return parents.map((parent) => ({
      id: parent.id,
      dcTitle: parent.dctitle,
    }));
  },
};
