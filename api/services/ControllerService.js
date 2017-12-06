'use strict';
module.exports = {
  treat: function(err, found, parameters, res) {
    if (err) {
      sails.log.error(err);
      return res.badRequest(parameters.controllerMethod + ' error: ' + err);
    }
    if (!found) {
      sails.log.debug(parameters.notFoundMessage);
      return res.notFound(parameters.notFoundMessage);
    }
    return res.json(found);
  },

  treatAndConvert: function(err, found, parameters, res, converter) {
    if (err) {
      let errorMessage = 'An internal error occurred when getting ' + parameters.searchedItem;
      sails.log.error(errorMessage + ': ' + err);
      return res.json(500, { error: errorMessage });
    }
    if (!found) {
      let notFoundMessage = parameters.searchedItem + ' not found';
      sails.log.debug(notFoundMessage);
      return res.json(404, { error: notFoundMessage });
    }
    return res.json(converter(found));
  }
};
