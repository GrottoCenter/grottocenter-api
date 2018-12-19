'use strict';

const client = require('../../config/elasticsearch').elasticsearchCli;
const resourcesToUpdate = [
  'grottos', 'massifs', 'entries'
];
const advancedSearchMetaParams = ['type', 'complete', 'match_all_queries'];

/*  Define the fuziness criteria. If equals to X, Elasticsearch will search
    all the keywords by changing / inverting / deleting X letters.

    Examples: 
    FUZINESS=1 and query=clomb will also use the query 'climb' (change 'o' to 'i' => 1 operation)
    FUZINESS=2 and query=clomb will also use the query 'lamb' (delete 'c', change 'o' to 'a' => 2 operations)
*/
const FUZINESS = 1;

module.exports = {
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
          query: {
            query_string: {
              query: '*'+params.query+'* + '+params.query+'~'+FUZINESS,
              fields: [
                // General useful fields
                'name^3', 'city^2', 'country', 'county', 'region',
                
                // ==== Entries
                'description^0.5',
                'caves',
                'riggings',
                'location^0.5',
                'bibliography^0.5',
                
                // ==== Grottos
                'custom_message', 
                'members',

                // ==== Massifs 
                'entries'
              ],
            }         
          },
          highlight : {
            number_of_fragments : 3,
            fragment_size : 50,
            fields: { 
              '*': {} 
            },
            order: 'score' 
          }        
        }
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
      let queryVerb = 'must';
      if(params.match_all_queries) {
        queryVerb = (params.match_all_queries === true ? 'must' : 'should');  
      }      
      
      // Build match fields to search on, i.e. every parameters in the url which are not metaParams
      const matchingParams = [];

      Object.keys(params).forEach(key => {
        if(!advancedSearchMetaParams.includes(key)) {
          const words = params[key].split(' ');
          words.map((word, index) => {
            const matchObj = {
              wildcard: {}
            };
          
            /* 
              The value is set to lower case because the data are indexed in lowercase. 
              We want a search not case sensitive.

              Also, the character * is used for the first and the last word to complete the query.
            */
            if(words.length === 1) matchObj.wildcard[key] = '*' + word.toLowerCase() + '*';
            else if(index === 0) matchObj.wildcard[key] = '*' + word.toLowerCase();
            else if(index === words.length - 1) matchObj.wildcard[key] = word.toLowerCase() + '*';
            else matchObj.wildcard[key] = word.toLowerCase();

            matchingParams.push(matchObj);
          });
        }
      });

      let query = {
        index: params.type + '-index',
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
          }        
        }
      };

      query.body.query.bool[queryVerb] = matchingParams;
      
      client.search(query).then(result => {
        resolve(result);
      }).catch(err => {
        reject(err);
      });
    });
    /* eslint-enable camelcase */
  }
};