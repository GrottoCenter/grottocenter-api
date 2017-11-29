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
      sails.log.error(err);
      return res.badRequest(parameters.controllerMethod + ' error: ' + err);
    }
    if (!found) {
      sails.log.debug(parameters.notFoundMessage);
      return res.notFound(parameters.notFoundMessage);
    }
    return res.json(converter(found));
  }
};
