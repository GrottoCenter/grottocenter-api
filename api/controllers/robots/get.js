// robots.txt of the API host (#1763): the JSON API is never meant to be
// indexed. The pages crawlers may index are static files served elsewhere.
// sendFile sets the Content-Type from the .txt extension.
module.exports = async (req, res) =>
  // eslint-disable-next-line consistent-return
  res.sendFile('robots-api.txt', { root: './assets' }, (err) => {
    // A client that disconnects mid-transfer (crawlers do) lands here after
    // the headers are sent: nobody is waiting for a 500.
    if (err && !res.headersSent) {
      return res.serverError({
        error: err,
        message: 'A server error occured when trying to get robots.txt.',
      });
    }
  });
