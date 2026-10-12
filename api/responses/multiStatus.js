/**
 * 207 (Multi-Status) Handler
 *
 * Usage:
 * return res.multiStatus();
 * return res.multiStatus(data);
 *
 *
 * @param  {Object | string | undefined} data
 */

module.exports = function multiStatus(data) {
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle
  const logResponse = sails.helpers.logResponse.with;
  const formatResponseData = sails.helpers.formatResponseData.with;

  const httpCode = 207;
  res.status(httpCode);
  logResponse.with({ httpCode, data });
  return res.json(formatResponseData.with({ data }));
};
