/**
 * IndexController
 *
 * @description :: Server-side logic for managing Indices
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
'use strict';
module.exports = {
  index: function(req, res) {
    return res.view('grottocenter');
  },
  map: function(req, res) {
    return res.view('grottocenter');
  }
};
