'use strict';

const resourcesToUpdate = [
  'grotto', 'caves', 'entries'
];

module.exports = {
  /*
    Update the Elasticsearch index according to the request.
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
        // TODO: update resource in index

      }
      if(verb === 'POST') {
        // TODO: add resource to index

      }
      if(verb === 'DELETE') {
        // TODO: delete resource from index
        
      }
    }
  },
};