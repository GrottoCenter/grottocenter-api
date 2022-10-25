const treatRange = (parameters, res, converter, found) => {
  res.set('Accept-Range', `${parameters.searchedItem} ${parameters.maxRange}`);

  const rangeTo = Math.min(
    parseInt(parameters.skip, 10) + parseInt(parameters.limit, 10),
    parameters.total
  );
  const firstTo = Math.min(parseInt(parameters.limit, 10), parameters.total);

  const prevFrom = Math.max(
    parseInt(parameters.skip, 10) - parseInt(parameters.limit, 10),
    0
  );
  const prevTo = Math.max(prevFrom + parseInt(parameters.limit, 10), 0);

  const nextFrom = Math.min(
    parseInt(parameters.skip, 10) + parseInt(parameters.limit, 10),
    parameters.total
  );
  const nextTo = Math.min(
    nextFrom + parseInt(parameters.limit, 10),
    parameters.total
  );

  const lastFrom = Math.max(
    parameters.total - parseInt(parameters.limit, 10),
    0
  );

  const baseUrl = parameters.url;
  const rangeExpr = /range=[0-9]+-[0-9]+/i;
  const first = baseUrl.replace(rangeExpr, `range=0-${firstTo}`);
  const prev = baseUrl.replace(rangeExpr, `range=${prevFrom}-${prevTo}`);
  const next = baseUrl.replace(rangeExpr, `range=${nextFrom}-${nextTo}`);
  const last = baseUrl.replace(
    rangeExpr,
    `range=${lastFrom}-${parameters.total}`
  );

  res.set('Content-Range', `${parameters.skip}-${rangeTo}/${parameters.total}`);
  res.set(
    'Link',
    `<${first}>; rel="first",  <${prev}>; rel="prev", <${next}>; rel="next",  <${last}>; rel="last"`
  );

  res.set('Access-Control-Expose-Headers', 'Content-Range');
  return res.partialContent(converter(found));
};

module.exports = {
  treat: (req, err, found, parameters, res) => {
    if (err) {
      return res.badRequest(`${parameters.controllerMethod} error: ${err}`);
    }
    if (!found) {
      return res.notFound(parameters.notFoundMessage);
    }
    return res.ok(found);
  },

  treatAndConvert: (req, err, found, parameters, res, converter) => {
    res.set(
      'Link',
      '<https://ontology.uis-speleo.org/grottocenter.org_context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
    );
    if (err) {
      sails.log.error(err);
      return res.serverError(
        `An internal error occurred when getting ${parameters.searchedItem}`
      );
    }
    if (!found) {
      return res.notFound(`${parameters.searchedItem} not found`);
    }
    if (parameters.total > found.length) {
      return treatRange(parameters, res, converter, found);
    }
    return res.ok(converter(found));
  },
};
