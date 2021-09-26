module.exports = {
  /**
   * @returns {Function} default Grottocenter ORM error handler
   */
  getDefaultOrmErrorHandler: () => {
    return (error) => {
      if (error.code && error.code === 'E_UNIQUE') {
        return res.sendStatus(409);
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
