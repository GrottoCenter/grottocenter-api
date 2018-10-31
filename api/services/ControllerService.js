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

    res.set('Accept-Range', parameters.searchedItem + ' ' + parameters.maxRange);

    if (parameters.total > found.length) {
      const rangeTo = Math.min(parseInt(parameters.skip) + parseInt(parameters.limit), parameters.total);
      const firstTo = Math.min(parseInt(parameters.limit), parameters.total);

      const prevFrom = Math.max(parseInt(parameters.skip) - parseInt(parameters.limit), 0);
      const prevTo = Math.max(prevFrom + parseInt(parameters.limit), 0);

      const nextFrom = Math.min(parseInt(parameters.skip) + parseInt(parameters.limit), parameters.total);
      const nextTo = Math.min(nextFrom + parseInt(parameters.limit), parameters.total);

      const lastFrom = Math.max(parameters.total - parseInt(parameters.limit), 0);

      const baseUrl = parameters.url;
      const rangeExpr = /range=[0-9]+-[0-9]+/i;
      const first = baseUrl.replace(rangeExpr, `range=0-${firstTo}`);
      const prev = baseUrl.replace(rangeExpr, `range=${prevFrom}-${prevTo}`);
      const next = baseUrl.replace(rangeExpr, `range=${nextFrom}-${nextTo}`);
      const last = baseUrl.replace(rangeExpr, `range=${lastFrom}-${parameters.total}`);

      res.set('Content-Range', `${parameters.skip}-${rangeTo}/${parameters.total}`);
      res.set('Link', `<${first}>; rel="first",  <${prev}>; rel="prev", <${next}>; rel="next",  <${last}>; rel="last"`);

      return res.json(206, converter(found));
    }

    return res.json(converter(found));
  }
};
