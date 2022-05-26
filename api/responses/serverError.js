/* eslint-disable no-param-reassign */
/**
 * 500 (Server Error) Response
 *
 * Usage:
 * return res.serverError();
 * return res.serverError(err);
 *
 * NOTE:
 * If something throws in a policy or controller, or an internal
 * error is encountered, Sails will call `res.serverError()`
 * automatically.
 *
 * @param  {Object | string | undefined} data
 */

module.exports = function serverError(data) {
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle
  const logResponse = sails.helpers.logResponse.with;
  const formatResponseData = sails.helpers.formatResponseData.with;

  const httpCode = 500;
  res.status(httpCode);
  logResponse.with({ httpCode, data });
  return res.json(formatResponseData.with({ data }));
};
