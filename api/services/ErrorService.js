module.exports = {
  /**
   * @returns {Function} default Grottocenter error handler
   */
  getDefaultErrorHandler: (res) => (error) => {
    if (error.code && error.code === 'E_UNIQUE') {
      const message = `A resource already exists with conflicting attribute value(s): ${error.attrNames.join(
        ','
      )}.`;
      return res.conflict(message);
    }
    switch (error.name) {
      case 'UsageError':
        return res.badRequest(error.message);
      case 'AdapterError':
        return res.badRequest(error.message);
      default:
        return res.serverError(error.message);
    }
  },
};
