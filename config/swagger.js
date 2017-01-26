module.exports.swagger = {
  /**
   * require() the package.json file for your Sails app.
   */
  pkg: require('../package'),
  ui: {
    url: getSwaggerUrl
  }
};

function getSwaggerUrl(req, res) {
  res.set(sails.config.appUrl + '/swagger/');
  res.end();
}
