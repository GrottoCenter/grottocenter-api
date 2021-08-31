/**
 * FileFormatController
 *
 * @description :: Server-side logic for managing file formats
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const fileFormatController = require('../FileFormatController');

module.exports = {
  findAll: (req, res) => fileFormatController.findAll(req, res),
};
