/**
 * 200 / 204 (OK) Response
 *
 * Before the request is sent back to the client, this response calls the "remove-sensitive-entrances" helper.
 *
 * Usage:
 * return res.ok();
 * return res.ok(data);
 *
 * @param  {Object | string | undefined} data
 */

module.exports = async function sendOK(data) {
  const { req } = this;
  const { res } = this;
  const sails = req._sails; // eslint-disable-line no-underscore-dangle
  const removeSensitiveEntrances = sails.helpers.removeSensitiveEntrances.with;
  const formatResponseData = sails.helpers.formatResponseData.with;
  const logResponse = sails.helpers.logResponse.with;

  // Set status code
  const httpCode = data ? 200 : 204;
  res.status(httpCode);

  // Filter data
  const filteredData = data
    ? await removeSensitiveEntrances({ req, data })
    : data;

  logResponse.with({ httpCode, data: filteredData });
  return res.json(formatResponseData.with({ data: filteredData }));
};
