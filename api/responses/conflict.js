/**
 * 409 (Conflict) Handler
 *
 * Usage:
 * return res.conflict();
 * return res.conflict(err);
 *
 * e.g.:
 * ```
 * return res.conflict('A resource already exists with conflicting attribute.');
 * ```
 *
 * @param  {Object | string | undefined} data
 */

module.exports = function forbidden(data) {
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle
  const logResponse = sails.helpers.logResponse.with;
  const formatResponseData = sails.helpers.formatResponseData.with;

  const httpCode = 409;
  res.status(httpCode);
  logResponse.with({ httpCode, data });
  return res.json(formatResponseData.with({ data }));
};
