/**
 * Bibliographic Metadata Service
 *
 * Service layer for managing bibliographic metadata records in compliance with Z39.50 and OAI-PMH (Open Archives Initiative
 * Protocol for Metadata Harvesting) specifications. This service provides comprehensive data access methods
 * for bibliographic metadata operations including record retrieval, filtering, counting, and set management.
 *
 * Key Features:
 * - OAI-PMH compliant record retrieval and filtering
 * - Date range filtering with ISO 8601 support
 * - Set-based record organization and filtering
 * - Metadata status management (registered/deleted)
 *
 * Database Model: VBibliographicMetadata
 */

// Enumeration of valid metadata status values for bibliographic records
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

/**
 * Builds criteria for filtering bibliographic metadata records using OAI-PMH parameters.
 *
 * @param {Object} parameters - OAI parameters (from, until, set)
 * @param {Object} baseCriteria - Base Waterline criteria (e.g. metadataStatus)
 * @returns {{ where: Object, postFilter: Function|null }}
 */
function buildOaiCriteria(parameters = {}, baseCriteria = {}) {
  const where = { ...baseCriteria };
  const range = {};

  // Handle "from"
  if (parameters.from) {
    const fromDate = new Date(parameters.from);
    if (Number.isNaN(fromDate.getTime()))
      throw new Error(`Invalid 'from' date: ${parameters.from}`);
    fromDate.setUTCHours(0, 0, 0, 0);
    range['>='] = fromDate;
  }

  // Handle "until"
  if (parameters.until) {
    const untilDate = new Date(parameters.until);
    if (Number.isNaN(untilDate.getTime()))
      throw new Error(`Invalid 'until' date: ${parameters.until}`);
    untilDate.setUTCHours(23, 59, 59, 999);
    range['<='] = untilDate;
  }

  if (Object.keys(range).length > 0) {
    where.lastUpdate = range;
  }

  // Handle set filtering after Waterline (array includes)
  const { set } = parameters;
  const postFilter = set
    ? (record) =>
        Array.isArray(record.listSets) && record.listSets.includes(set)
    : null;

  return { where, postFilter };
}

async function getOAIRecordsPaginatedWithoutSet(
  parameters = {},
  filter = { metadataStatus: METADATA_STATUS.REGISTERED }
) {
  try {
    // Validate and sanitize pagination parameters
    const limit = Math.max(0, parseInt(parameters.limit, 10) || 50);
    const offset = Math.max(0, parseInt(parameters.offset, 10) || 0);

    const { where } = buildOaiCriteria(parameters, filter);

    // Si pas de filtre set, on peut utiliser directement Waterline avec pagination
    const records = await sails.models.vbibliographicmetadata.find({
      where,
      limit,
      skip: offset,
      sort: 'id ASC', // Pour assurer un ordre consistant
    });

    // Requête pour le total (sans pagination)
    const total = await module.exports.countRecords(parameters, filter);

    return {
      records,
      total,
      limit,
      offset,
      hasNext: offset + limit < total,
    };
  } catch (error) {
    sails.log.error('Error in getOAIRecordsPaginated:', error);
    throw error;
  }
}

async function getOAIRecordsPaginatedWithSet(
  parameters = {},
  filter = { metadataStatus: METADATA_STATUS.REGISTERED }
) {
  try {
    // Validate and sanitize pagination parameters
    const limit = Math.max(0, parseInt(parameters.limit, 10) || 50);
    const offset = Math.max(0, parseInt(parameters.offset, 10) || 0);

    // Si filtre par set, on doit utiliser une approche différente car array filtering
    // Pour les performances, on utilise une requête SQL native
    const setCondition = parameters.set ? `AND $1 = ANY(list_sets)` : '';
    const setParams = parameters.set ? [parameters.set] : [];

    const whereConditions = [];

    // Only add metadata status filter if explicitly provided
    if (filter.metadataStatus) {
      whereConditions.push(`metadata_status = '${filter.metadataStatus}'`);
    }

    const sqlParams = [...setParams];
    let paramIndex = setParams.length + 1;

    // Ajouter les conditions de date
    if (parameters.from) {
      whereConditions.push(`last_update >= $${paramIndex}::timestamp`);
      sqlParams.push(parameters.from);
      paramIndex += 1;
    }
    if (parameters.until) {
      whereConditions.push(`last_update <= $${paramIndex}::timestamp`);
      sqlParams.push(parameters.until);
      paramIndex += 1;
    }

    const whereClause =
      whereConditions.length > 0 ? whereConditions.join(' AND ') : '';
    const whereSQL = whereClause ? `WHERE ${whereClause}` : 'WHERE 1=1';

    // Requête pour récupérer les records paginés
    const recordsQuery = `
    SELECT id_document as id
    FROM v_bibliographic_metadata
    ${whereSQL} ${setCondition}
    ORDER BY id_document ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    const recordsParams = [...sqlParams, limit, offset];
    const { rows: ids } = await sails.sendNativeQuery(
      recordsQuery,
      recordsParams
    );

    // Requête pour le total
    const countQuery = `
    SELECT COUNT(*) as total
    FROM v_bibliographic_metadata
    ${whereSQL} ${setCondition}
  `;

    const {
      rows: [{ total }],
    } = await sails.sendNativeQuery(countQuery, sqlParams);

    const records = await sails.models.vbibliographicmetadata.find({
      where: { id: ids.map((r) => r.id) },
    });

    return {
      records,
      total: parseInt(total, 10),
      limit,
      offset,
      hasNext: offset + limit < parseInt(total, 10),
    };
  } catch (error) {
    sails.log.error('Error in getOAIRecordsPaginated:', error);
    throw error;
  }
}

async function getOAIIdentifiersPaginatedWithoutSet(
  parameters = {},
  filter = { metadataStatus: METADATA_STATUS.REGISTERED }
) {
  try {
    // Validate and sanitize pagination parameters
    const limit = Math.max(0, parseInt(parameters.limit, 10) || 50);
    const offset = Math.max(0, parseInt(parameters.offset, 10) || 0);

    const { where } = buildOaiCriteria(parameters, filter);

    // Si pas de filtre set, on peut utiliser directement Waterline avec pagination
    const identifiers = await sails.models.vbibliographicmetadata.find({
      where,
      select: ['oaiIdentifier', 'lastUpdate', 'listSets'],
      limit,
      skip: offset,
      sort: 'id ASC', // Pour assurer un ordre consistant
    });

    // Requête pour le total (sans pagination)
    const total = await module.exports.countRecords(parameters, filter);

    return {
      identifiers,
      total,
      limit,
      offset,
      hasNext: offset + limit < total,
    };
  } catch (error) {
    sails.log.error('Error in getOAIIdentifiersPaginatedWithoutSet:', error);
    throw error;
  }
}

async function getOAIIdentifiersPaginatedWithSet(
  parameters = {},
  filter = { metadataStatus: METADATA_STATUS.REGISTERED }
) {
  try {
    const limit = parseInt(parameters.limit, 10) || 50;
    const offset = parseInt(parameters.offset, 10) || 0;

    // Si filtre par set, utiliser une requête SQL native pour les performances
    const setCondition = parameters.set ? `AND $1 = ANY(list_sets)` : '';
    const setParams = parameters.set ? [parameters.set] : [];

    const whereConditions = [];

    // Only add metadata status filter if explicitly provided
    if (filter.metadataStatus) {
      whereConditions.push(`metadata_status = '${filter.metadataStatus}'`);
    }

    const sqlParams = [...setParams];
    let paramIndex = setParams.length + 1;

    // Ajouter les conditions de date
    if (parameters.from) {
      whereConditions.push(`last_update >= $${paramIndex}::timestamp`);
      sqlParams.push(parameters.from);
      paramIndex += 1;
    }
    if (parameters.until) {
      whereConditions.push(`last_update <= $${paramIndex}::timestamp`);
      sqlParams.push(parameters.until);
      paramIndex += 1;
    }

    const whereClause =
      whereConditions.length > 0 ? whereConditions.join(' AND ') : '';
    const whereSQL = whereClause ? `WHERE ${whereClause}` : 'WHERE 1=1';

    // Requête pour récupérer les identifiers paginés (seulement les champs nécessaires)
    const identifiersQuery = `
      SELECT oai_identifier as "oaiIdentifier", last_update as "lastUpdate", list_sets as "listSets"
      FROM v_bibliographic_metadata
      ${whereSQL} ${setCondition}
      ORDER BY id_document ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const identifiersParams = [...sqlParams, limit, offset];
    const { rows: identifiers } = await sails.sendNativeQuery(
      identifiersQuery,
      identifiersParams
    );

    // Requête pour le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM v_bibliographic_metadata
      ${whereSQL} ${setCondition}
    `;

    const {
      rows: [{ total }],
    } = await sails.sendNativeQuery(countQuery, sqlParams);

    return {
      identifiers,
      total: parseInt(total, 10),
      limit,
      offset,
      hasNext: offset + limit < parseInt(total, 10),
    };
  } catch (error) {
    sails.log.error('Error in getOAIIdentifiersPaginatedWithSet:', error);
    throw error;
  }
}

module.exports = {
  /**
   * Retrieves a Single Bibliographic Metadata Record by ID
   *
   * Fetches a specific bibliographic metadata record using its unique identifier.
   * This method supports filtering by metadata status to control visibility of
   * deleted or inactive records.
   *
   * @param {string} id - Unique identifier of the bibliographic metadata record
   * @param {boolean} [registeredOnly=true] - Filter to include only active registered records
   * @returns {Promise<Object|null>} Bibliographic metadata record or null if not found
   * @throws {Error} Database query errors
   */
  async getMetadata(id, registeredOnly = true) {
    const criteria = {};

    // Apply status filter if only registered records are requested
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
      // search by title - use unaccent if available, otherwise fall back to simple ILIKE
      let sqlTitle;
      try {
        // Try with unaccent first
        sqlTitle = `SELECT id_document AS id, children
              FROM v_bibliographic_metadata
              WHERE metadata_status = 'registered'
              AND unaccent(dc_title) ILIKE unaccent('%${titleFilter}%')`;
        const { rows } = await sails.sendNativeQuery(sqlTitle);
        const ids = rows.map((m) => m.id);
        const children = rows.flatMap((m) => m.children || []);
        matchingIds = Array.from(new Set([...ids, ...children]));
      } catch (error) {
        // If unaccent function doesn't exist, fall back to simple ILIKE
        if (error.message && error.message.includes('unaccent')) {
          sails.log.warn(
            'unaccent extension not available, falling back to ILIKE search'
          );
          sqlTitle = `SELECT id_document AS id, children
                FROM v_bibliographic_metadata
                WHERE metadata_status = 'registered'
                AND dc_title ILIKE '%${titleFilter}%'`;
          const { rows } = await sails.sendNativeQuery(sqlTitle);
          const ids = rows.map((m) => m.id);
          const children = rows.flatMap((m) => m.children || []);
          matchingIds = Array.from(new Set([...ids, ...children]));
        } else {
          throw error;
        }
      }
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

  /**
   * Retrieves All Distinct OAI-PMH Set Specifications
   *
   * Extracts and returns a sorted list of all unique OAI-PMH set specifications
   * from the bibliographic metadata repository. This method implements the ListSets
   * verb functionality by aggregating set data from all records.
   *
   * @param {boolean} [registeredOnly=true] - When false, includes sets from deleted records; when true, only sets from records with metadataStatus = 'registered' are returned
   * @returns {Promise<string[]>} Sorted array of distinct set specifications
   * @throws {Error} Database query or processing errors
   */
  async getDistinctSets(registeredOnly = true) {
    try {
      // Initialize query criteria object
      const criteria = {};

      // Apply metadata status filter if only registered records are requested
      if (registeredOnly) {
        criteria.metadataStatus = METADATA_STATUS.REGISTERED;
      }

      // Fetch records with only the listSets field to optimize query performance
      const records = await sails.models.vbibliographicmetadata.find({
        where: criteria,
        select: ['listSets'],
      });

      // Use Set data structure to automatically handle uniqueness
      const allSets = new Set();

      // Process each record to extract and normalize set specifications
      records.forEach((record) => {
        // Ensure listSets exists and is an array
        if (record.listSets && Array.isArray(record.listSets)) {
          record.listSets.forEach((set) => {
            // Clean and validate each set specification
            if (set && set.trim()) {
              allSets.add(set.trim());
            }
          });
        }
      });

      // Convert Set to sorted array for consistent output
      return Array.from(allSets).sort();
    } catch (error) {
      sails.log.error('Error in getDistinctSets:', error);
      throw error;
    }
  },

  /**
   * Retrieves Single Record by OAI-PMH Identifier
   *
   * Implements the GetRecord verb of the OAI-PMH protocol by fetching a specific
   * bibliographic metadata record using its unique OAI identifier. Supports
   * flexible filtering based on metadata status and other criteria.
   *
   * @param {string} identifier - Unique OAI-PMH identifier for the target record
   * @param {Object} [filter={metadataStatus: 'registered'}] - Query filter criteria
   * @param {string} [filter.metadataStatus] - Metadata status filter ('registered' or 'deleted')
   * @returns {Promise<Object|null>} Complete bibliographic metadata record or null if not found
   * @throws {Error} Database query errors or invalid identifier format
   */
  async getOAIRecord(
    identifier,
    filter = { metadataStatus: METADATA_STATUS.REGISTERED }
  ) {
    try {
      // Construct Waterline criteria combining identifier and status filter
      const criteria = {
        oaiIdentifier: identifier,
        ...filter,
      };

      // Fetch single record matching criteria
      const result =
        await sails.models.vbibliographicmetadata.findOne(criteria);
      return result || null;
    } catch (error) {
      sails.log.error('Error in getRecord:', error);
      throw error;
    }
  },

  /**
   * Retrieves Single Record by ID
   *
   * Fetches a specific bibliographic metadata record using its numeric ID.
   * This method supports filtering by metadata status and returns the complete record.
   *
   * @param {number|string} id - Numeric ID of the target record
   * @param {Object} [filter={}] - Query filter criteria (by default, includes both registered and deleted)
   * @param {string} [filter.metadataStatus] - Optional metadata status filter ('registered' or 'deleted')
   * @returns {Promise<Object|null>} Complete bibliographic metadata record or null if not found
   * @throws {Error} Database query errors or invalid ID format
   */
  async getRecordById(id, filter = {}) {
    try {
      // Parse and validate ID
      const parsedId = parseInt(id, 10);
      if (Number.isNaN(parsedId) || parsedId <= 0) {
        return null;
      }

      // Construct Waterline criteria combining ID and optional status filter
      const criteria = {
        id: parsedId,
        ...filter,
      };

      // Fetch single record matching criteria
      const result =
        await sails.models.vbibliographicmetadata.findOne(criteria);
      return result || null;
    } catch (error) {
      sails.log.error('Error in getRecordById:', error);
      throw error;
    }
  },

  /**
   * Retrieves Complete Bibliographic Records with OAI-PMH Filtering
   *
   * Implements the ListRecords verb of the OAI-PMH protocol by returning complete
   * bibliographic metadata records that match the specified criteria. Supports
   * date range filtering, set-based filtering, and metadata status filtering.
   *
   * @param {Object} [parameters={}] - OAI-PMH query parameters for filtering
   * @param {string} [parameters.set] - OAI-PMH set specification to filter records
   * @param {string} [parameters.from] - Start date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {string} [parameters.until] - End date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {Object} [filter={metadataStatus: 'registered'}] - Additional filter criteria
   * @param {string} [filter.metadataStatus] - Metadata status filter ('registered' or 'deleted')
   * @returns {Promise<Array<Object>>} Array of complete bibliographic metadata records
   * @throws {Error} Database query errors or invalid date format
   */
  async getOAIRecords(
    parameters = {},
    filter = { metadataStatus: METADATA_STATUS.REGISTERED }
  ) {
    try {
      const { where, postFilter } = buildOaiCriteria(parameters, filter);

      // Execute database query with non-array filters (Waterline doesn't support array filtering)
      let records = await sails.models.vbibliographicmetadata.find(where);

      // Apply set filtering in JavaScript since listSets is an array field
      // This is necessary because SQL/Waterline array operations are limited
      if (postFilter) {
        records = records.filter(postFilter);
      }

      return records;
    } catch (error) {
      sails.log.error('Error in recordsQuery:', error);
      throw error;
    }
  },

  /**
   * Retrieves OAI-PMH Identifiers with Minimal Metadata
   *
   * Implements the ListIdentifiers verb of the OAI-PMH protocol by returning only
   * essential header information (identifiers, timestamps, sets) without full metadata
   * content. This provides an efficient way to discover available records for harvesting.
   *
   * @param {Object} [parameters={}] - OAI-PMH query parameters for filtering
   * @param {string} [parameters.set] - OAI-PMH set specification to filter records
   * @param {string} [parameters.from] - Start date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {string} [parameters.until] - End date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {Object} [filter={metadataStatus: 'registered'}] - Additional filter criteria
   * @param {string} [filter.metadataStatus] - Metadata status filter ('registered' or 'deleted')
   * @returns {Promise<Array<Object>>} Array of identifier objects with minimal metadata
   * @returns {string} return[].oaiIdentifier - Unique OAI-PMH identifier
   * @returns {Date} return[].lastUpdate - Last modification timestamp
   * @returns {string[]} return[].listSets - Array of associated set specifications
   * @throws {Error} Database query errors or invalid date format
   */
  async getOAIIdentifiers(
    parameters = {},
    filter = { metadataStatus: METADATA_STATUS.REGISTERED }
  ) {
    try {
      const { where, postFilter } = buildOaiCriteria(parameters, filter);

      // Optimize query by selecting only essential fields for identifier response
      // This reduces network transfer and memory usage for large datasets
      let records = await sails.models.vbibliographicmetadata.find({
        where,
        select: ['oaiIdentifier', 'lastUpdate', 'listSets'],
      });

      // Apply set filtering in JavaScript since array operations are limited in SQL
      // This post-query filtering ensures accurate results for set-based queries
      if (postFilter) {
        records = records.filter(postFilter);
      }

      // Return records with listSets included for OAI-PMH header information
      // ListSets is required for proper OAI-PMH identifier responses
      return records;
    } catch (error) {
      sails.log.error('Error in identifiersQuery:', error);
      throw error;
    }
  },

  /**
   * Counts Bibliographic Records Matching OAI-PMH Criteria
   *
   * Provides an efficient count of bibliographic metadata records that match the
   * specified OAI-PMH parameters without retrieving the full record data. This is
   * useful for pagination and resource estimation in OAI-PMH implementations.
   *
   * @param {Object} [parameters={}] - OAI-PMH query parameters for filtering
   * @param {string} [parameters.set] - OAI-PMH set specification to filter records
   * @param {string} [parameters.from] - Start date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {string} [parameters.until] - End date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {Object} [filter={metadataStatus: 'registered'}] - Additional filter criteria
   * @param {string} [filter.metadataStatus] - Metadata status filter ('registered' or 'deleted')
   * @returns {Promise<number>} Total count of records matching the specified criteria
   * @throws {Error} Database query errors or invalid date format
   */
  async countRecords(
    parameters = {},
    filter = { metadataStatus: METADATA_STATUS.REGISTERED }
  ) {
    try {
      const { where, postFilter } = buildOaiCriteria(parameters, filter);

      const records = await sails.models.vbibliographicmetadata.find({
        where,
        select: ['id', 'lastUpdate', 'listSets', 'metadataStatus'],
      });

      if (postFilter) {
        const filteredRecords = records.filter(postFilter);

        return filteredRecords.length;
      }

      return records.length;
    } catch (error) {
      sails.log.error('Error in countPublication:', error);
      throw error;
    }
  },

  /**
   * Retrieves Complete Bibliographic Records with OAI-PMH Filtering and Pagination
   *
   * Version paginée de getOAIRecords qui supporte limit/offset pour améliorer les performances.
   *
   * @param {Object} [parameters={}] - OAI-PMH query parameters for filtering
   * @param {string} [parameters.set] - OAI-PMH set specification to filter records
   * @param {string} [parameters.from] - Start date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {string} [parameters.until] - End date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {number} [parameters.limit=50] - Maximum number of records to return
   * @param {number} [parameters.offset=0] - Number of records to skip (for pagination)
   * @param {Object} [filter={metadataStatus: 'registered'}] - Additional filter criteria
   * @returns {Promise<Object>} Object containing records array, total count, and pagination info
   * @returns {Array<Object>} return.records - Array of complete bibliographic metadata records
   * @returns {number} return.total - Total number of records matching the criteria (without pagination)
   * @returns {number} return.limit - Applied limit
   * @returns {number} return.offset - Applied offset
   * @returns {boolean} return.hasNext - Whether there are more records after this page
   */
  async getOAIRecordsPaginated(
    parameters = {},
    filter = { metadataStatus: METADATA_STATUS.REGISTERED }
  ) {
    try {
      // Si pas de filtre set, on peut utiliser directement Waterline avec pagination
      if (!parameters.set) {
        return this.getOAIRecordsPaginatedWithoutSet(parameters, filter);
      }

      return this.getOAIRecordsPaginatedWithSet(parameters, filter);
    } catch (error) {
      sails.log.error('Error in getOAIRecordsPaginated:', error);
      throw error;
    }
  },

  /**
   * Retrieves OAI-PMH Identifiers with Minimal Metadata and Pagination
   *
   * Version paginée de getOAIIdentifiers qui supporte limit/offset pour améliorer les performances.
   *
   * @param {Object} [parameters={}] - OAI-PMH query parameters for filtering
   * @param {string} [parameters.set] - OAI-PMH set specification to filter records
   * @param {string} [parameters.from] - Start date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {string} [parameters.until] - End date (inclusive, filters on `lastUpdate`) – format: ISO 8601
   * @param {number} [parameters.limit=50] - Maximum number of identifiers to return
   * @param {number} [parameters.offset=0] - Number of identifiers to skip (for pagination)
   * @param {Object} [filter={metadataStatus: 'registered'}] - Additional filter criteria
   * @returns {Promise<Object>} Object containing identifiers array, total count, and pagination info
   * @returns {Array<Object>} return.identifiers - Array of identifier objects with minimal metadata
   * @returns {number} return.total - Total number of identifiers matching the criteria (without pagination)
   * @returns {number} return.limit - Applied limit
   * @returns {number} return.offset - Applied offset
   * @returns {boolean} return.hasNext - Whether there are more identifiers after this page
   */
  async getOAIIdentifiersPaginated(
    parameters = {},
    filter = { metadataStatus: METADATA_STATUS.REGISTERED }
  ) {
    try {
      // Si pas de filtre set, on peut utiliser directement Waterline avec pagination
      if (!parameters.set) {
        return getOAIIdentifiersPaginatedWithoutSet(parameters, filter);
      }

      return getOAIIdentifiersPaginatedWithSet(parameters, filter);
    } catch (error) {
      sails.log.error('Error in getOAIIdentifiersPaginated:', error);
      throw error;
    }
  },

  getOAIRecordsPaginatedWithSet,
  getOAIRecordsPaginatedWithoutSet,
  getOAIIdentifiersPaginatedWithSet,
  getOAIIdentifiersPaginatedWithoutSet,
};
