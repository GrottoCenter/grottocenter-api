/* eslint-disable no-param-reassign */
/**
 * 500 (Server Error) Response
 *
 * Return always the same message ('An internal server error occurred.') whatever the data passed in.
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

const { isCancelledOnAbort } = require('../utils/logger');

module.exports = function serverError(data) {
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle
  const logResponse = sails.helpers.logResponse.with;
  const formatResponseData = sails.helpers.formatResponseData.with;

  const httpCode = 500;
  res.status(httpCode);
  if (isCancelledOnAbort(data)) {
    // The client went away and the queries it was waiting for were cancelled
    // (#1849): nothing failed on the server, and no one receives this 500.
    // Not a `Sending 500` line, which is what triage counts (#1919). The
    // write below lands on a dead socket and is discarded (#1818).
    const dropped =
      'Dropped 500 ("Server Error") response (query cancelled after client abort)';
    if (data === undefined) sails.log.warn(dropped);
    else sails.log.warn(`${dropped}: \n`, data);
  } else {
    logResponse.with({ httpCode, data });
  }
  return res.json(
    formatResponseData.with({
      data: { message: 'An internal server error occurred.' },
    })
  );
};
