module.exports = {
  /**
   * @returns {Function} default Grottocenter error handler
   */
  getDefaultErrorHandler: (res) => {
    return (error) => {
      if (error.code && error.code === 'E_UNIQUE') {
        return res
          .status(409)
          .send(
            'A resource already exists with conflicting attribute value(s): ' +
              error.attrNames.join(',') +
              '.',
          );
      } else {
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
