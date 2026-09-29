/**
 * Built-in Log Configuration
 * (sails.config.log)
 *
 * Configure the log level for your app, as well as the transport
 * (Underneath the covers, Sails uses Winston for logging, which
 * allows for some pretty neat custom transports/adapters for log messages)
 *
 * For more information on the Sails logger, check out:
 * http://sailsjs.org/#/documentation/concepts/Logging
 */

const winston = require('winston');
// Pure util with no reference to the `sails` global, so it is safe to require
// here -- this file is evaluated before Sails lifts.
const { scrubString } = require('../api/utils/redactLogArgs');

module.exports.log = {
  level: 'info',
  noShip: true,

  // Custom formatter for production to handle multiline logs in Azure
  // Custom formatter for non-production to add timestamps
  // No custom logger in test environment
  //
  // `scrubString` here is a backstop, not the main defence. By this point
  // captains-log has already flattened everything into one string, so only a
  // textual scrub is possible. The structured redaction happens upstream in
  // api/utils/logger.js; this catches what that patch does not wrap -- the
  // `silly` and `crit` levels, the callable `sails.log(...)` form, and any future
  // call site added outside the patch. It does not see raw console.log output.
  ...(process.env.NODE_ENV !== 'test' && {
    custom: winston.createLogger({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.printf(({ message }) => {
              const msg =
                typeof message === 'string' ? message : JSON.stringify(message);
              return scrubString(msg).replace(/\n/g, '\\n');
            })
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.printf(({ message, timestamp }) => {
                const msg =
                  typeof message === 'string'
                    ? message
                    : JSON.stringify(message);
                return `${timestamp} ${scrubString(msg)}`;
              })
            ),
      transports: [new winston.transports.Console()],
    }),
  }),
};
