/**
 * LicenseController
 *
 * @description :: Server-side logic for managing licenses
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const licenseController = require('../LicenseController');

module.exports = {
  findAll: (req, res) => licenseController.findAll(req, res),
};
