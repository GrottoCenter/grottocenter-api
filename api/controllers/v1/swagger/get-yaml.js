module.exports = async (req, res) =>
  // eslint-disable-next-line consistent-return
  res.sendFile('swaggerV1.yaml', { root: './assets' }, (err) => {
    if (err) {
      return res.serverError({
        error: err,
        message:
          'A server error occured when trying to get the v1 API swagger yaml file.',
      });
    }
  });
