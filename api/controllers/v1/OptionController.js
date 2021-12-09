/**
 * OptionController
 *
 * @description :: Server-side logic for managing options
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const optionController = require('../OptionController');

module.exports = {
  findAll: (req, res) => optionController.findAll(req, res),
};
