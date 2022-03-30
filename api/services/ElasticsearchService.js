/**
 */

const client = require('../../config/elasticsearch').elasticsearchCli;

// const INDEX_NAMES = [
//   'caves',
//   'cavers',
//   'documents',
//   'document-collections',
//   'document-issues',
//   'entrances',
//   'grottos',
//   'massifs',
//   'networks',
// ];
const advancedSearchMetaParams = [
  'resourceType',
  'complete',
  'matchAllFields',
  'from',
  'size',
];

/*  Define the fuziness criteria. If equals to X, Elasticsearch will search
    all the keywords by changing / inverting / deleting X letters.

    Examples:
    FUZZINESS=1 and query=clomb will also use the query 'climb' (change 'o' to 'i' => 1 operation)
    FUZZINESS=2 and query=clomb will also use the query 'lamb'
      (delete 'c', change 'o' to 'a' => 2 operations)
*/
const FUZZINESS = 1;

// eslint-disable-next-line no-multi-assign
const self = (module.exports = {
  /**
   * Delete a resource indexed by Elasticsearch. No check performed on the parameters given.
   * The action is asynchronous and if an error occurs, it will simply logged.
   * @param {string} indexName  An Elasticsearch index (@see ElasticsearchService INDEX_NAMES)
   * @param {string} resourceId The id of the resource to delete.
   */
  deleteResource: async (indexName, resourceId) => {
    try {
      await client.delete({
        // Asynchronous operation
        index: `${indexName}-index`,
        id: resourceId,
      });
    } catch (error) {
      sails.log.error(error);
    }
  },
  /**
   * Retrieve data from elasticsearch on various index according to a string.
   * The indexes used are: ['grottos', 'entrances', 'massifs', 'documents', 'cavers']
   * (document-collections and document-issues are excluded by default)
   * Params should contain an attribute 'query': others params are facultative.
   * @param {*} params  list of params of the request including :
   *    @param {string}         query keyword(s) to use for the search
   *    @param {integer}        from (optional, default = 0) number of first results to skip
   *    @param {integer}        size (optional, default = 10) number of first results to return
   *    @param {string}         resourceType (optional) resource type to search on.
   *            Must be one of INDEX_NAMES at the top of this file
   *    @param {Array(string)}  resourceTypes (optional) resource types to search on.
   *            Must be an array containing some of the INDEX_NAMES at the top of this file
   */
  searchQuery: (params) => new Promise((resolve, reject) => {
    let indexToSearchOn = [
      'cavers',
      'documents',
      'entrances',
      'grottos',
      'massifs',
    ];
    if (params.resourceTypes instanceof Array) {
      indexToSearchOn = params.resourceTypes.map(
        (resType) => `${resType}-index`,
      );
    } else if (params.resourceType) {
      indexToSearchOn = `${params.resourceType}-index`;
    }

    client
      .search({
        /* eslint-disable camelcase */
        index: indexToSearchOn,
        body: {
          from: params.from ? params.from : 0,
          size: params.size ? params.size : 10,
          query: {
            query_string: {
              query: `*${self.sanitizeQuery(
                params.query,
              )}* + ${self.sanitizeQuery(params.query)}~${FUZZINESS}`,
              fields: [
                // General useful fields
                'name^5',
                'names^1.5',
                'description^0.5',
                'descriptions^0.5',
                'city^2',
                'country',
                'county',
                'region',

                // ==== Entrances
                'caves',
                'riggings',
                'location^0.5',
                'bibliography^0.5',

                // ==== Grottos
                'custom_message',

                // ==== Massifs

                // ==== Document
                'title^2.7',
                'authors',
                'ref_bbs',
                'subjects',
                'identifier^1.5',

                // ==== Cavers
                'surname^4',
                'nickname^3',
                'mail^5',
              ],
            },
          },
          highlight: {
            number_of_fragments: 3,
            fragment_size: 50,
            fields: {
              '*': {},
            },
            order: 'score',
          },
        },
        /* eslint-enable camelcase */
      })
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  }),

  /**
   * Retrieve data from elasticsearch on all index according to the given params.
   * The results must match all the params in the url which are not metaParams
   * (@see advancedSearchMetaParams). Each value can be prefix or suffix.
   *
   * For more info, see ES 6.5 documentation:
   * - https://www.elastic.co/guide/en/elasticsearch/reference/6.5/query-dsl-wildcard-query.html
   * - https://www.elastic.co/guide/en/elasticsearch/reference/6.5/query-filter-context.html
   *
   * @param {*} params : list of params of the request
   */
  advancedSearchQuery: (params) => new Promise((resolve, reject) => {
    /* eslint-disable camelcase */
    // Determine if the logic operator is OR (should) or AND (must) for the request.
    const queryVerb = params.matchAllFields === false ? 'should' : 'must';

    // Build match fields to search on, i.e. every parameters in the url which are not metaParams
    const matchingParams = [];
    const rangeParams = [];
    const boolParams = [];

    // ==== Construct the params
    Object.keys(params).forEach((key) => {
      // Meta params ?
      if (!advancedSearchMetaParams.includes(key)) {
        // min / max (range) param ? boolean param ? field param ?
        const isMinParam = key.split('-min').length > 1;
        const isMaxParam = key.split('-max').length > 1;
        const isBoolParam = key.split('-bool').length > 1;
        const isFieldParam = !isMinParam && !isMaxParam && !isBoolParam;

        // Value of a field
        if (isFieldParam && params[key] !== '') {
          // Sanitize all the query and remove empty words
          const sanitizedWords = self
            .sanitizeQuery(params[key])
            .split(' ')
            .filter((w) => w !== '');
          sanitizedWords.map((word, index) => {
            const matchObj = {
              wildcard: {},
            };

            /*
                The value is set to lower case because the data are indexed in lowercase.
                We want a search not case sensitive.

                The character * is used for the first and the last word to (auto)complete the query.
              */
            if (sanitizedWords.length === 1) {
              matchObj.wildcard[key] = `*${word.toLowerCase()}*`;
            } else if (index === 0) {
              matchObj.wildcard[key] = `*${word.toLowerCase()}`;
            } else if (index === sanitizedWords.length - 1) {
              matchObj.wildcard[key] = `${word.toLowerCase()}*`;
            } else {
              matchObj.wildcard[key] = word.toLowerCase();
            }

            return matchingParams.push(matchObj);
          });

          // Min range param
        } else if (isMinParam) {
          const rangeObj = {
            range: {},
          };
          rangeObj.range[key.split('-min')[0].toString()] = {
            gte: params[key],
          };
          rangeParams.push(rangeObj);

          // Max range param
        } else if (isMaxParam) {
          const rangeObj = {
            range: {},
          };
          rangeObj.range[key.split('-max')[0].toString()] = {
            lte: params[key],
          };
          rangeParams.push(rangeObj);

          // Bool param
        } else if (isBoolParam) {
          const boolObj = {
            term: {},
          };
          boolObj.term[key.split('-bool')[0].toString()] = params[key];
          boolParams.push(boolObj);
        }
      }
    });

    // ==== Build the query
    const query = {
      index: `${params.resourceType}-index`,
      body: {
        query: {
          bool: {},
        },
        highlight: {
          number_of_fragments: 3,
          fragment_size: 50,
          fields: {
            '*': {},
          },
          order: 'score',
        },
        from: params.from ? params.from : 0,
        size: params.size ? params.size : 10,
      },
    };

    query.body.query.bool[queryVerb] = matchingParams
      .concat(rangeParams)
      .concat(boolParams);

    client
      .search(query)
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  }), /* eslint-enable camelcase */

  /**
   * Custom GC wrapper for the Elasticsearch client create method
   * to make it fail silently if needed.
   * Check if the connection is alive before creating the document in ES. If it's not, return false.
   * If the creation fails, log the error and return false.
   *
   * @param {String} indexName
   * @param {number} id data id (must be unique)
   * @param {Object} body data to index, including the tags value
   * @returns
   */
  create: async (indexName, id, body) => {
    if (!(await self.isConnectionAlive())) {
      return false;
    }
    try {
      await client.create({
        index: `${indexName}-index`,
        id,
        body,
      });
    } catch (error) {
      sails.log.error(error);
      return false;
    }
    return true;
  },

  /**
   * Replace all special characters from a source string by a space.
   * @param {*} sourceString
   */
  sanitizeQuery: (sourceString) => {
    // eslint-disable-next-line no-useless-escape
    let sanitizedString = sourceString.replace(
      /[`~!@#$%^&*()_|+\-=?;:",<>«»{}[\]/\\]/gi,
      ' ',
    );
    sanitizedString = sanitizedString[sanitizedString.length - 1] === '.'
      ? sanitizedString.slice(0, -1)
      : sanitizedString;
    return sanitizedString.trim();
  },

  isConnectionAlive: async () => {
    try {
      await client.ping({
        requestTimeout: 1000, // ping usually has a 3000ms timeout
      });
    } catch (error) {
      sails.log.error(error);
      client.close();
      return false;
    }
    return true;
  },
});
