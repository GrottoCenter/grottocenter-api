// Other http codes (like 200 or 204) are logged as "verbose" instead.
const LOG_SEVERITY_INFO_FOR_CODES = [401, 403, 404, 409];
const LOG_SEVERITY_ERROR_FOR_CODES = [500];

module.exports = {
  friendlyName: 'Log response',
  description: 'Log response type, code and data to console.',
  sync: true,
  inputs: {
    httpCode: {
      type: 'number',
      description: 'HTTP status code',
      example: 401,
    },
    data: {
      type: 'ref',
      description: 'Data to log (can be a JS object, a string or undefined)',
      example: { foo: 3, bar: true },
    },
  },

  exits: {
    success: {
      description: 'All done.',
    },
  },

  fn(inputs) {
    const { data, httpCode } = inputs;
    let responseType = '';
    switch (httpCode) {
      case 200:
      case 204:
        responseType = 'OK';
        break;
      case 206:
        responseType = 'Partial Content';
        break;
      case 401:
        responseType = 'Unauthorized';
        break;
      case 403:
        responseType = 'Forbidden';
        break;
      case 404:
        responseType = 'Not Found';
        break;
      case 409:
        responseType = 'Conflict';
        break;
      case 500:
        responseType = 'Server Error';
        break;
      default:
        responseType = 'UNKOWN';
    }

    let logSeverity = 'verbose';
    if (LOG_SEVERITY_INFO_FOR_CODES.includes(httpCode)) {
      logSeverity = 'info';
    } else if (LOG_SEVERITY_ERROR_FOR_CODES.includes(httpCode)) {
      logSeverity = 'error';
    }

    if (data !== undefined) {
      sails.log[logSeverity](
        `Sending ${httpCode} ("${responseType}") response: \n`,
        data
      );
    } else
      sails.log[logSeverity](
        `Sending ${httpCode} ("${responseType}") response`
      );
  },
};
