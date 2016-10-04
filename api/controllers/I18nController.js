/**
 * I18nController
 *
 * @description :: Server-side logic for managing I18ns
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  translate: function(req, res) {
    return res.json(req.__(req.param('label')));
  }
};
