/**
 * 404 (Not Found) Handler
 *
 * Usage:
 * return res.notFound();
 * return res.notFound(err);
 *
 * e.g.:
 * ```
 * return res.notFound('Massif of id 1234 not found.');
 * ```
 *
 * @param  {Object | string | undefined} data
 */

module.exports = function notFound(data) {
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle
  const logResponse = sails.helpers.logResponse.with;
  const formatResponseData = sails.helpers.formatResponseData.with;

  const httpCode = 404;
  res.status(httpCode);
  logResponse({ httpCode, data });
  return res.json(formatResponseData({ data }));
};
