module.exports = {
  /**
   * @returns {Function} default Grottocenter error handler
   */
  getDefaultErrorHandler: (res) => {
    return (error) => {
      if (error.code && error.code === 'E_UNIQUE') {
        const message =
          'A resource already exists with conflicting attribute value(s): ' +
          error.attrNames.join(',') +
          '.';
        sails.log.error(message);
        // eslint-disable-next-line no-console
        console.log(message); // Test purpose to see if sails.log are ignored in production, to be removed eventually
        return res.status(409).send(message);
      } else {
        sails.log.error(error.message);
        // eslint-disable-next-line no-console
        console.log(error.message); // Test purpose to see if sails.log are ignored in production, to be removed eventually
        switch (error.name) {
          case 'UsageError':
            return res.badRequest(error.message);
          case 'AdapterError':
            return res.badRequest(error.message);
          default:
            return res.serverError(error.message);
        }
      }
    };
  },
};
