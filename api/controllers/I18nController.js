/**
 * I18nController
 *
 * @description :: Server-side logic for managing I18ns
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
'use strict';
module.exports = {
  translate: function(req, res) {
    req.setLocale(req.session.languagePreference);
    return res.json(req.__(req.param('label')));
  },
  catalog: function(req, res) {
    return res.json(req.getCatalog(req.params.locale));
  },
};
