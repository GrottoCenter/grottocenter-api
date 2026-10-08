/**
 * 503 (Service Unavailable) Response
 *
 * Unlike serverError, the data passed in is sent as is.
 *
 * Usage:
 * return res.serviceUnavailable(data);
 *
 * @param  {Object | string | undefined} data
 */

module.exports = function serviceUnavailable(data) {
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle
  const logResponse = sails.helpers.logResponse.with;
  const formatResponseData = sails.helpers.formatResponseData.with;

  const httpCode = 503;
  res.status(httpCode);
  logResponse.with({ httpCode, data });
  return res.json(formatResponseData.with({ data }));
};
