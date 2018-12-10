'use strict';

const client = require('../../config/elasticsearch');

const resourcesToUpdate = [
  'grotto', 'caves', 'entries'
];

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
};