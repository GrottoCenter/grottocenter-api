// robots.txt of the API host (#1763): the JSON API is never meant to be
// indexed. The pages crawlers may index are static files served elsewhere.
module.exports = async (req, res) => {
  res.type('text/plain');
  // eslint-disable-next-line consistent-return
  return res.sendFile('robots-api.txt', { root: './assets' }, (err) => {
    if (err) {
      return res.serverError({
        error: err,
        message: 'A server error occured when trying to get robots.txt.',
      });
    }
  });
};
