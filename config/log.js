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

module.exports.log = {
  level: 'info',
  noShip: true,

  // Custom formatter for production to handle multiline logs in Azure
  // Custom formatter for non-production to add timestamps
  // No custom logger in test environment
  ...(process.env.NODE_ENV !== 'test' && {
    custom: winston.createLogger({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.printf(({ message }) => {
              const msg =
                typeof message === 'string' ? message : JSON.stringify(message);
              return msg.replace(/\n/g, '\\n');
            })
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.printf(({ message, timestamp }) => {
                const msg =
                  typeof message === 'string'
                    ? message
                    : JSON.stringify(message);
                return `${timestamp} ${msg}`;
              })
            ),
      transports: [new winston.transports.Console()],
    }),
  }),
};
