/**
 * 422 (Unprocessable entity) Handler
 *
 * Usage:
 * return res.unprocessable();
 * return res.unprocessable(data);
 *
 * e.g.:
 * ```
 * return res.unprocessable(
 *   "You request is understood but can't be processed."
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

  const httpCode = 422;
  res.status(httpCode);
  logResponse.with({ httpCode, data });
  return res.json(formatResponseData.with({ data }));
};
