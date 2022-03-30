/**
 * SwaggerController.js
 *
 * @description :: v1 Swagger controller
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
  sendYaml: async (req, res) => res.sendFile('swaggerV1.yaml', { root: './assets' }, (err) => {
    if (err) {
      sails.log.error(err);
      return res.serverError(
        'A server error occured when trying to get the v1 API swagger yaml file.',
      );
    }
  }),
};
