const { getMetaFromRequest, toListFromController } = require('./mapping/utils');

const treatRange = (parameters, req, res, converter, found) => {
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
  const meta = getMetaFromRequest(req);
  // Converters that declare a second parameter receive request metadata (meta).
  // Single-param converters (e.g., toMassif) are called without meta.
  return res.partialContent(
    converter.length > 1 ? converter(found, meta) : converter(found)
  );
};

module.exports = {
  /**
   * Populate a record a create controller has just persisted. The creation
   * already succeeded at this point, so a failed or empty populate must not
   * turn into a 500: it is logged and the unpopulated record is returned, which
   * the converters accept (associations stay as ids) (#1655).
   *
   * @param {Object} created the record returned by create().fetch()
   * @param {Function} populate receives created.id, resolves the populated record
   * @param {String} controllerMethod used to prefix the log line
   * @return {Object} the populated record, or `created` when populating failed
   */
  populateCreated: async (created, populate, controllerMethod) => {
    try {
      const populated = await populate(created.id);
      if (populated) return populated;
      sails.log.error(
        `${controllerMethod}: populating the created record ${created.id} returned nothing, answering with the unpopulated record`
      );
    } catch (error) {
      sails.log.error(
        `${controllerMethod}: failed to populate the created record ${created.id}, answering with the unpopulated record`,
        error
      );
    }
    return created;
  },

  treat: (req, err, found, parameters, res) => {
    if (err) {
      return res.badRequest(`${parameters.controllerMethod} error: ${err}`);
    }
    if (!found) {
      return res.notFound(parameters.notFoundMessage);
    }
    return res.ok(found);
  },

  /**
   * Answer one page of a core collection under its usual wrapper `{ [key] }`.
   *
   * A non-empty page is a 206 with `Content-Range: <skip>-<to>/<total>`; no
   * match, or a page past the end, is a 200 with an empty array. The rows are
   * converted as they are: the query already applied the deletion filter, so
   * the converter must not drop the soft-deleted rows a privileged caller
   * asked for.
   *
   * @param {object} req Sails request
   * @param {object} res Sails response
   * @param {object} page
   * @param {string} page.key wrapper key (`entrances`, `caves`, …)
   * @param {Array} page.rows records of the page
   * @param {number} page.total number of records matching the filters
   * @param {number} page.skip
   * @param {number} page.limit
   * @param {Function} page.converter (row, meta) => converted row
   * @param {string} page.controllerMethod
   * @param {string} page.searchedItem
   * @param {object} [page.extra] extra properties of an empty answer
   */
  treatPage: (
    req,
    res,
    {
      key,
      rows,
      total,
      skip,
      limit,
      converter,
      controllerMethod,
      searchedItem,
      extra = {},
    }
  ) => {
    if (rows.length === 0) return res.ok({ [key]: [], ...extra });
    return module.exports.treatAndConvert(
      req,
      null,
      rows,
      {
        controllerMethod,
        searchedItem,
        limit,
        skip,
        total,
        url: req.originalUrl,
      },
      res,
      (data, meta) =>
        toListFromController(key, data, converter, {
          filterDeleted: false,
          meta,
        })
    );
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
    if (parameters.total >= found.length) {
      return treatRange(parameters, req, res, converter, found);
    }
    const meta = getMetaFromRequest(req);
    // Converters that declare a second parameter receive request metadata (meta).
    // Single-param converters (e.g., toMassif) are called without meta.
    return res.ok(
      converter.length > 1 ? converter(found, meta) : converter(found)
    );
  },
};
