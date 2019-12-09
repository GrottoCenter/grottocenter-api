'use strict';

const client = require('../../config/elasticsearch').elasticsearchCli;
const resourcesToUpdate = [
  'grottos', 'massifs', 'entries', 'bbs'
];
const advancedSearchMetaParams = ['resourceType', 'complete', 'matchAllFields', 'from', 'size'];

/*  Define the fuziness criteria. If equals to X, Elasticsearch will search
    all the keywords by changing / inverting / deleting X letters.

    Examples: 
    FUZZINESS=1 and query=clomb will also use the query 'climb' (change 'o' to 'i' => 1 operation)
    FUZZINESS=2 and query=clomb will also use the query 'lamb' (delete 'c', change 'o' to 'a' => 2 operations)
*/
const FUZZINESS = 1;

const self = module.exports = {
  /**
  * Update the Elasticsearch index according to the request.
  * @param {*} found resource to be updated 
  * @param {*} req req object of the client
  */
  updateIndex: function (found, req) {
    const { url, verb } = req;

    // Parse request resource
    const urlPieces = url.split('/');

    // Resource name is right after "/api/"
    let i = 0;
    let resourceIndex = -1;
    while(resourceIndex === -1 && i < urlPieces.length) {
      if(urlPieces[i] === 'api') {
        advancedSearchMetaParams;
        resourceIndex = i + 1;
      }
      i += 1;
    }

    if(resourceIndex === -1) {
      sails.log.info('Resource not found');
      return;
    }
    
    const resourceName = urlPieces[resourceIndex];
    // Update index resources appropriately
    if(resourcesToUpdate.includes(resourceName)){

      if(verb === 'PUT') {
        // Asynchronous operation, no callback
        client.update({
          index: resourceName +'-index',
          type: resourceName,
          id: found.id,
          body: found
        });
      }

      if(verb === 'POST') {
        // Asynchronous operation, no callback
        client.create({
          index: resourceName +'-index',
          type: resourceName,
          id: found.id,
          body: found
        });
      }

      if(verb === 'DELETE') {
        // Asynchronous operation, no callback
        client.delete({
          index: resourceName +'-index',
          type: resourceName,
          id: found.id
        });        
      }
      
    }
  },

  /**
   * Retrieve data from elasticsearch on all index according to a string
   * Params should contain an attribute query
   * @param {*} params : list of params of the request
   */
  searchQuery: function(params) {
    return new Promise(function(resolve, reject) {
      client.search({
        /* eslint-disable camelcase */
        index: '_all',
        body: {
          from: params.from ? params.from : 0,
          size: params.size ? params.size : 10,
          query: {
            query_string: {
              query: '*'+self.sanitizeQuery(params.query)+'* + '+self.sanitizeQuery(params.query)+'~'+FUZZINESS,
              fields: [
                // General useful fields
                'name^5', 'city^2', 'country', 'county', 'region',
                
                // ==== Entries
                'descriptions^0.5',
                'caves',
                'riggings',
                'location^0.5',
                'bibliography^0.5',
                
                // ==== Grottos
                'custom_message', 
                'cavers names',

                // ==== Massifs 
                'entries names', 'entries regions', 'entries cities', 'entry counties', 'entries countries',

                // ==== BBS 
                'bbs title^2.8', 'bbs authors', 'bbs abstract^0.5', 'bbs ref', 'bbs country', 'bbs theme', 'bbs subtheme', 'bbs publication'
              ],
            },       
          },
          highlight : {
            number_of_fragments : 3,
            fragment_size : 50,
            fields: { 
              '*': {} 
            },
            order: 'score' 
          },     
        },
        /* eslint-enable camelcase */
      }).then(result => {
        resolve(result);
      }).catch(err => {
        reject(err);
      });
    });
  }, 

  /**
   * Retrieve data from elasticsearch on all index according to the given params.
   * The results must match all the params in the url which are not metaParams (@see advancedSearchMetaParams).
   * Each value can be prefix or suffix.
   * 
   * For more info, see ES 6.5 documentation:
   * - https://www.elastic.co/guide/en/elasticsearch/reference/6.5/query-dsl-wildcard-query.html 
   * - https://www.elastic.co/guide/en/elasticsearch/reference/6.5/query-filter-context.html
   * 
   * @param {*} params : list of params of the request 
   */
  advancedSearchQuery: function(params) {
    /* eslint-disable camelcase */
    return new Promise(function(resolve, reject) {

      // Determine if the logic operator is OR (should) or AND (must) for the request.
      const queryVerb = (params.matchAllFields === false ? 'should' : 'must');  
      
      // Build match fields to search on, i.e. every parameters in the url which are not metaParams
      const matchingParams = [];
      const rangeParams = [];

      // ==== Construct the params
      Object.keys(params).forEach(key => {
        // Meta params ? 
        if(!advancedSearchMetaParams.includes(key)) {

          // min / max (range) param ? or field param ?
          const isMinParam = (key.split('-min').length > 1);
          const isMaxParam = (key.split('-max').length > 1);
          const isFieldParam = (!isMinParam && !isMaxParam); 

          // Value of a field
          if(isFieldParam && params[key] !== '') {
            // Sanitize all the query and remove empty words
            const sanitizedWords = self.sanitizeQuery(params[key]).split(' ').filter(w => w !== '');
            sanitizedWords.map((word, index) => {
              const matchObj = {
                wildcard: {}
              };

              /* 
                The value is set to lower case because the data are indexed in lowercase. 
                We want a search not case sensitive.

                Also, the character * is used for the first and the last word to (auto)complete the query.
              */
              if(sanitizedWords.length === 1) matchObj.wildcard[key] = '*' + word.toLowerCase() + '*';
              else if(index === 0) matchObj.wildcard[key] = '*' + word.toLowerCase();
              else if(index === sanitizedWords.length - 1) matchObj.wildcard[key] = word.toLowerCase() + '*';
              else matchObj.wildcard[key] = word.toLowerCase();

              matchingParams.push(matchObj);
            });
          
          // Min range param
          } else if(isMinParam) {
            const rangeObj = {
              range: {
              }
            };
            rangeObj.range[key.split('-min')[0].toString()] = {
              gte: params[key]
            };
            rangeParams.push(rangeObj);

          // Max range param
          } else if(isMaxParam) {
            const rangeObj = {
              range: {
              }
            };
            rangeObj.range[key.split('-max')[0].toString()] = {
              lte: params[key]
            };
            rangeParams.push(rangeObj);
          }
        }
      });

      // ==== Build the query
      let query = {
        index: params.resourceType + '-index',
        body: {
          query: {
            bool: {
              
            },
          },
          highlight : {
            number_of_fragments : 3,
            fragment_size : 50,
            fields: { 
              '*': {} 
            },
            order: 'score' 
          },
          from: params.from ? params.from : 0,
          size: params.size ? params.size : 10,
        }
      };

      query.body.query.bool[queryVerb] = matchingParams.concat(rangeParams);
      
      client.search(query).then(result => {
        resolve(result);
      }).catch(err => {
        reject(err);
      });
    });
    /* eslint-enable camelcase */
  },

  /**
   * Replace all special characters from a source string by a space.
   * @param {*} sourceString 
   */
  sanitizeQuery: function(sourceString) {
    return sourceString.replace(/[`~!@#$%^&*()_|+\-=?;:'",<>\{\}\[\]\\\/]/gi, ' ');
  },
};