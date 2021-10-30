/**
 * LicenseController.js
 *
 * @description :: tLicense controller
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
  findAll: async (req, res) => {
    try {
      const licenses = await TLicense.find();
      return res.ok(licenses);
    } catch (err) {
      return res.serverError(
        'There was a problem while retrieving the licenses.',
      );
    }
  },
};
