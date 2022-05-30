/**
 * 206 (Partial Content) Handler
 *
 * Usage:
 * return res.partialContent();
 * return res.partialContent(data);
 *
 *
 * @param  {Object | string | undefined} data
 */

module.exports = function partialContent(data) {
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle
  const logResponse = sails.helpers.logResponse.with;
  const formatResponseData = sails.helpers.formatResponseData.with;

  const httpCode = 206;
  res.status(httpCode);
  logResponse.with({ httpCode, data });
  return res.json(formatResponseData.with({ data }));
};
