/**
 * 400 (Bad Request) Handler
 *
 * Usage:
 * return res.badRequest();
 * return res.badRequest(data);
 *
 * e.g.:
 * ```
 * return res.badRequest(
 *   'Please choose a valid `password` (6-12 characters)'
 * );
 * ```
 *
 * @param  {Object | string | undefined} data
 */

module.exports = function badRequest(data) {
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle
  const logResponse = sails.helpers.logResponse.with;
  const formatResponseData = sails.helpers.formatResponseData.with;

  const httpCode = 400;
  res.status(httpCode);
  logResponse.with({ httpCode, data });
  return res.json(formatResponseData.with({ data }));
};
